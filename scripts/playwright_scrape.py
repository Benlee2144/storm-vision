#!/usr/bin/env python3
"""
Scrape traffic cameras from newly discovered state DOT APIs.
Uses urllib with browser-like headers for reliable HTTP requests.

Targets:
- CARS Program APIs: MN, CO, NE, IA (GET JSON)
- South Carolina: Iteris CDN GeoJSON (GET)
- Missouri: MoDOT timconfig feed (GET JSON)
- Connecticut: ctroads.org 511 DataTables (POST)
- Oklahoma: oktraffic.org LoopBack API (GET JSON)
- Kentucky: ArcGIS Feature Server (GET JSON)
- Maryland: CHART export (GET JSON)
- Ohio: OHGO API (GET JSON)
"""

import json
import os
import re
import ssl
import sys
import time
import urllib.request
from urllib.parse import quote

# SSL context for sites with cert issues
_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


class SimpleHTTP:
    """Minimal wrapper around urllib to match the Playwright request API shape."""

    def get(self, url, headers=None, **kwargs):
        hdrs = {"User-Agent": _UA, "Accept": "application/json"}
        if headers:
            hdrs.update(headers)
        req = urllib.request.Request(url, headers=hdrs)
        resp = urllib.request.urlopen(req, timeout=30, context=_ssl_ctx)
        return _Response(resp)

    def post(self, url, data=None, headers=None, **kwargs):
        hdrs = {"User-Agent": _UA, "Accept": "application/json"}
        if headers:
            hdrs.update(headers)
        body = data.encode() if isinstance(data, str) else data
        req = urllib.request.Request(url, data=body, headers=hdrs)
        resp = urllib.request.urlopen(req, timeout=30, context=_ssl_ctx)
        return _Response(resp)


class _Response:
    def __init__(self, resp):
        self._resp = resp
        self._body = resp.read()
        self.status = resp.status
        self.ok = 200 <= resp.status < 400

    def json(self):
        return json.loads(self._body.decode("utf-8"))

OUTPUT_DIR = "scripts/output"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def make_camera(id, name, lat, lon, state_name, state_code, stream_type,
                stream_url, thumbnail_url, attribution, highway="",
                direction="", city=""):
    """Build a normalized camera record."""
    return {
        "id": id,
        "name": name[:120] if name else f"{state_code} Camera",
        "latitude": round(float(lat), 6),
        "longitude": round(float(lon), 6),
        "city": city or "",
        "state": state_name,
        "stateCode": state_code,
        "source": "dot",
        "category": "traffic",
        "streamType": stream_type,
        "streamUrl": stream_url or "",
        "thumbnailUrl": thumbnail_url or "",
        "isActive": True,
        "attribution": attribution,
        "highway": highway or "",
        "direction": direction or "",
    }


def save_cameras(cameras, state_code, label=""):
    """Save camera list to JSON file."""
    filename = f"{state_code.lower()}_cameras.json"
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, "w") as f:
        json.dump(cameras, f, indent=2)
    print(f"  Saved {len(cameras)} cameras to {filepath}")
    return cameras


# ──────────────────────────────────────────────────────────────────────────────
# CARS Program API scrapers (MN, CO, NE, IA share identical format)
# ──────────────────────────────────────────────────────────────────────────────

CARS_STATES = [
    {
        "code": "MN", "name": "Minnesota",
        "api": "https://mntg.carsprogram.org/cameras_v1/api/cameras",
        "attribution": "MnDOT / MN511",
        "hls_pattern": None,  # URLs in the views data
        "snapshot_pattern": None,
    },
    {
        "code": "CO", "name": "Colorado",
        "api": "https://cotg.carsprogram.org/cameras_v1/api/cameras",
        "attribution": "CDOT / COTrip",
        "hls_pattern": None,
        "snapshot_pattern": None,
    },
    {
        "code": "NE", "name": "Nebraska",
        "api": "https://netg.carsprogram.org/cameras_v1/api/cameras",
        "attribution": "NDOR / NE 511",
        "hls_pattern": None,
        "snapshot_pattern": None,
    },
    {
        "code": "IA", "name": "Iowa",
        "api": "https://iatg.carsprogram.org/cameras_v1/api/cameras",
        "attribution": "Iowa DOT / 511IA",
        "hls_pattern": None,
        "snapshot_pattern": None,
    },
]


def scrape_cars_state(api_ctx, state_cfg):
    """Scrape a CARS Program state API."""
    code = state_cfg["code"]
    print(f"\n{'='*60}")
    print(f"Scraping {state_cfg['name']} ({code}) - CARS Program API")
    print(f"  URL: {state_cfg['api']}")

    try:
        resp = api_ctx.get(state_cfg["api"])
        if not resp.ok:
            print(f"  HTTP {resp.status} - skipping")
            return []
        data = resp.json()
    except Exception as e:
        print(f"  Error: {e}")
        return []

    print(f"  Raw cameras: {len(data)}")
    cameras = []

    for cam in data:
        loc = cam.get("location", {})
        lat = loc.get("latitude")
        lon = loc.get("longitude")
        if not lat or not lon:
            continue

        name = cam.get("name", "")
        route = loc.get("routeId", "")
        city_ref = loc.get("cityReference", "")
        views = cam.get("views", [])

        # Find best stream URL from views
        stream_url = ""
        thumbnail_url = ""
        stream_type = "image_refresh"

        for view in views:
            url = view.get("url", "")
            vtype = view.get("type", "")
            if vtype == "WMP" and "m3u8" in url:
                stream_url = url
                stream_type = "hls"
            elif vtype == "STILL_IMAGE" and url:
                if not thumbnail_url:
                    thumbnail_url = url
                if not stream_url:
                    stream_url = url

        # If no URL found in views, try to build snapshot URL from view mainRoute
        if not stream_url and not thumbnail_url:
            for view in views:
                url = view.get("url", "")
                if url:
                    stream_url = url
                    thumbnail_url = url
                    break

        cam_id = f"{code.lower()}-cars-{cam.get('id', len(cameras))}"
        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name=state_cfg["name"], state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url=thumbnail_url or stream_url,
            attribution=state_cfg["attribution"],
            highway=route, city=city_ref,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"  HLS streams: {hls_count}, Image refresh: {len(cameras) - hls_count}")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# South Carolina - Iteris CDN GeoJSON
# ──────────────────────────────────────────────────────────────────────────────

def scrape_south_carolina(api_ctx):
    """Scrape SC cameras from Iteris CDN GeoJSON."""
    code = "SC"
    print(f"\n{'='*60}")
    print(f"Scraping South Carolina - Iteris CDN GeoJSON")
    url = "https://cctv-cdn.iteris-atis.com/geojson/icons_scdot.geojson"
    print(f"  URL: {url}")

    try:
        resp = api_ctx.get(url)
        if not resp.ok:
            print(f"  HTTP {resp.status} - skipping")
            return []
        data = resp.json()
    except Exception as e:
        print(f"  Error: {e}")
        return []

    features = data.get("features", [])
    print(f"  Raw features: {len(features)}")
    cameras = []

    for feat in features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])

        if not coords or len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]
        if not lat or not lon:
            continue

        name = props.get("tooltip", "") or props.get("description", "")
        cam_id_raw = props.get("id", "") or props.get("cctv_id", "")

        # Extract stream URLs from properties
        hls_url = props.get("hlsUrl", "") or props.get("hls_url", "")
        rtmp_url = props.get("rtmpUrl", "") or props.get("rtmp_url", "")
        img_url = props.get("url", "") or props.get("imageUrl", "") or props.get("posterImage", "")

        stream_url = hls_url or rtmp_url or img_url or ""
        stream_type = "hls" if hls_url else ("image_refresh" if img_url else "image_refresh")
        thumbnail = props.get("posterImage", "") or img_url or ""

        cam_id = f"sc-iteris-{cam_id_raw or len(cameras)}"
        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name="South Carolina", state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url=thumbnail, attribution="SCDOT",
        ))

    print(f"  Extracted {len(cameras)} cameras")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Missouri - MoDOT timconfig feed
# ──────────────────────────────────────────────────────────────────────────────

def scrape_missouri(api_ctx):
    """Scrape MO cameras from MoDOT timconfig feed."""
    code = "MO"
    print(f"\n{'='*60}")
    print(f"Scraping Missouri - MoDOT timconfig feed")
    url = "https://traveler.modot.org/timconfig/cctvFeedAny.json"
    print(f"  URL: {url}")

    try:
        resp = api_ctx.get(url)
        if not resp.ok:
            print(f"  HTTP {resp.status} - skipping")
            return []
        data = resp.json()
    except Exception as e:
        print(f"  Error: {e}")
        return []

    cctv_list = data if isinstance(data, list) else data.get("cctv", data.get("features", []))
    if isinstance(data, dict) and not cctv_list:
        # Try top-level keys
        for key in data:
            if isinstance(data[key], list) and len(data[key]) > 10:
                cctv_list = data[key]
                break

    print(f"  Raw entries: {len(cctv_list)}")
    cameras = []

    for cam in cctv_list:
        lat = cam.get("latitude") or cam.get("lat") or cam.get("y")
        lon = cam.get("longitude") or cam.get("lon") or cam.get("lng") or cam.get("x")

        if not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        if abs(lat) > 90 or abs(lon) > 180:
            continue

        name = cam.get("description", "") or cam.get("name", "") or cam.get("location", "")
        route = cam.get("route", "") or cam.get("roadway", "")
        direction = cam.get("direction", "")
        city = cam.get("city", "") or cam.get("county", "")

        # Stream URLs
        hls_url = cam.get("hlsUrl", "") or cam.get("hls_url", "") or cam.get("streamUrl", "")
        img_url = cam.get("imageUrl", "") or cam.get("url", "") or cam.get("snapshotUrl", "")

        stream_url = hls_url or img_url or ""
        stream_type = "hls" if (hls_url and "m3u8" in str(hls_url)) else "image_refresh"
        thumbnail = img_url or ""

        cam_id_raw = cam.get("id", "") or cam.get("cameraId", "") or cam.get("cctvId", "")
        cam_id = f"mo-modot-{cam_id_raw or len(cameras)}"

        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name="Missouri", state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url=thumbnail, attribution="MoDOT",
            highway=route, direction=direction, city=city,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"  HLS streams: {hls_count}, Image refresh: {len(cameras) - hls_count}")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Connecticut - ctroads.org 511 DataTables
# ──────────────────────────────────────────────────────────────────────────────

def scrape_connecticut(api_ctx):
    """Scrape CT cameras from ctroads.org with DataTables pagination."""
    code = "CT"
    print(f"\n{'='*60}")
    print(f"Scraping Connecticut - ctroads.org 511 DataTables")
    url = "https://www.ctroads.org/List/GetData/Cameras"
    print(f"  URL: {url}")

    cameras = []
    page_size = 100
    start = 0
    total = None

    while True:
        body = (
            f"draw=1&start={start}&length={page_size}"
            f"&search%5Bvalue%5D=&search%5Bregex%5D=false&type=camera"
        )

        try:
            resp = api_ctx.post(url, data=body, headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
                "Referer": "https://www.ctroads.org/",
            })
            if not resp.ok:
                print(f"  HTTP {resp.status} at offset {start} - stopping")
                break
            data = resp.json()
        except Exception as e:
            print(f"  Error at offset {start}: {e}")
            break

        batch = data.get("data", [])
        if total is None:
            total = data.get("recordsTotal", 0)
            print(f"  Total cameras reported: {total}")

        if not batch:
            break

        for cam in batch:
            # Parse WKT coordinates
            latlng = cam.get("latLng", {})
            geo = latlng.get("geography", {}) if isinstance(latlng, dict) else {}
            wkt = geo.get("wellKnownText", "")
            m = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", wkt)
            if not m:
                continue
            lon = float(m.group(1))
            lat = float(m.group(2))

            name = cam.get("location", "") or cam.get("roadway", "")
            roadway = cam.get("roadway", "")
            direction = cam.get("direction", "")
            city = cam.get("city", "")

            # Image URL
            images = cam.get("images", [])
            img_url = ""
            if images:
                img_url = images[0].get("imageUrl", "")
                if img_url and not img_url.startswith("http"):
                    img_url = "https://www.ctroads.org" + img_url

            cam_id_raw = cam.get("id", "")
            cam_id = f"ct-511-{cam_id_raw or len(cameras)}"

            cameras.append(make_camera(
                id=cam_id, name=name, lat=lat, lon=lon,
                state_name="Connecticut", state_code=code,
                stream_type="image_refresh", stream_url=img_url,
                thumbnail_url=img_url, attribution="CTDOT / CTRoads",
                highway=roadway, direction=direction, city=city,
            ))

        start += page_size
        print(f"  Scraped {len(cameras)} / {total} cameras...")

        if total and start >= total:
            break
        time.sleep(0.5)

    print(f"  Extracted {len(cameras)} cameras")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Oklahoma - oktraffic.org LoopBack API
# ──────────────────────────────────────────────────────────────────────────────

def scrape_oklahoma(api_ctx):
    """Scrape OK cameras from oktraffic.org LoopBack API."""
    code = "OK"
    print(f"\n{'='*60}")
    print(f"Scraping Oklahoma - oktraffic.org LoopBack API")

    # First get the simple MapCameras list for positions
    url1 = "https://oktraffic.org/api/MapCameras"
    print(f"  URL: {url1}")

    try:
        resp = api_ctx.get(url1)
        if not resp.ok:
            print(f"  HTTP {resp.status} for MapCameras - skipping")
            return []
        map_cameras = resp.json()
    except Exception as e:
        print(f"  Error fetching MapCameras: {e}")
        return []

    print(f"  MapCameras entries: {len(map_cameras)}")

    # Then get CameraPoles with stream data
    filter_param = json.dumps({
        "include": [{
            "relation": "mapCameras",
            "scope": {
                "include": "streamDictionary",
                "where": {
                    "status": {"neq": "Out Of Service"},
                    "type": "Web",
                    "blockAtis": {"neq": "1"},
                }
            }
        }]
    })
    url2 = f"https://oktraffic.org/api/CameraPoles?filter={quote(filter_param)}"
    print(f"  Fetching CameraPoles with streams...")

    stream_map = {}  # camera_id -> stream_url
    try:
        resp2 = api_ctx.get(url2)
        if resp2.ok:
            poles = resp2.json()
            for pole in poles:
                for mc in pole.get("mapCameras", []):
                    sd = mc.get("streamDictionary", {})
                    stream_key = sd.get("streamKey", "")
                    if stream_key:
                        stream_map[mc.get("id")] = f"https://stream.oktraffic.org/delay-stream/{stream_key}/playlist.m3u8"
            print(f"  Stream URLs found: {len(stream_map)}")
    except Exception as e:
        print(f"  Warning: Could not fetch CameraPoles: {e}")

    cameras = []
    for cam in map_cameras:
        lat = cam.get("latitude")
        lon = cam.get("longitude")
        if not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        if abs(lat) > 90 or abs(lon) > 180:
            continue

        name = cam.get("location", "") or cam.get("cameraId", "")
        direction = cam.get("direction", "")
        city = cam.get("city", "")
        cam_raw_id = cam.get("id")

        stream_url = stream_map.get(cam_raw_id, "")
        stream_type = "hls" if stream_url else "image_refresh"

        cam_id = f"ok-oktraffic-{cam_raw_id or len(cameras)}"
        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name="Oklahoma", state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url="", attribution="Oklahoma Traffic / HBE Systems",
            direction=direction, city=city,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"  HLS streams: {hls_count}, Image refresh: {len(cameras) - hls_count}")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Kentucky - ArcGIS Feature Server
# ──────────────────────────────────────────────────────────────────────────────

def scrape_kentucky(api_ctx):
    """Scrape KY cameras from KYTC ArcGIS MapServer."""
    code = "KY"
    print(f"\n{'='*60}")
    print(f"Scraping Kentucky - KYTC ArcGIS")

    base_url = "https://maps.kytc.ky.gov/arcgis/rest/services/Traffic_Camera/MapServer/0"

    # Get count
    count_url = f"{base_url}/query?where=1%3D1&returnCountOnly=true&f=json"
    print(f"  URL: {base_url}")

    try:
        resp = api_ctx.get(count_url)
        if not resp.ok:
            print(f"  HTTP {resp.status} - skipping")
            return []
        count_data = resp.json()
        total = count_data.get("count", 0)
        print(f"  Total features: {total}")
    except Exception as e:
        print(f"  Error getting count: {e}")
        return []

    # Fetch all features with pagination
    all_features = []
    offset = 0
    page_size = 500

    while offset < total:
        query_url = (
            f"{base_url}/query?where=1%3D1&outFields=*&outSR=4326"
            f"&resultOffset={offset}&resultRecordCount={page_size}&f=json"
        )
        try:
            resp = api_ctx.get(query_url)
            if not resp.ok:
                break
            data = resp.json()
            features = data.get("features", [])
            if not features:
                break
            all_features.extend(features)
            offset += len(features)
            print(f"  Fetched {len(all_features)}/{total}...")
            if len(features) < page_size:
                break
            time.sleep(0.3)
        except Exception as e:
            print(f"  Error at offset {offset}: {e}")
            break

    cameras = []
    for feat in all_features:
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {})

        lat = geom.get("y")
        lon = geom.get("x")
        if not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        if abs(lat) > 90 or abs(lon) > 180:
            continue

        # Find fields dynamically
        lower_attrs = {k.lower(): (k, v) for k, v in attrs.items()}

        name = ""
        for field in ["description", "name", "camera_name", "location", "title", "label"]:
            if field in lower_attrs:
                name = str(lower_attrs[field][1] or "")
                if name and name.lower() != "none":
                    break

        img_url = ""
        for field in ["imageurl", "image_url", "url", "snapshot_url", "snapshoturl",
                       "hlsurl", "hls_url", "streamurl", "stream_url", "video_url",
                       "camera_url", "link", "image"]:
            if field in lower_attrs:
                img_url = str(lower_attrs[field][1] or "")
                if img_url and img_url.lower() != "none":
                    break

        highway = ""
        for field in ["route", "highway", "road", "roadway"]:
            if field in lower_attrs:
                highway = str(lower_attrs[field][1] or "")
                if highway and highway.lower() != "none":
                    break

        oid = attrs.get("OBJECTID", attrs.get("objectid", attrs.get("FID", len(cameras))))
        stream_type = "hls" if img_url and "m3u8" in img_url else "image_refresh"

        if not name:
            name = f"KY Camera {oid}"

        cam_id = f"ky-arcgis-{oid}"
        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name="Kentucky", state_code=code,
            stream_type=stream_type, stream_url=img_url,
            thumbnail_url=img_url, attribution="KYTC",
            highway=highway,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Maryland - CHART Export JSON
# ──────────────────────────────────────────────────────────────────────────────

def scrape_maryland(api_ctx):
    """Scrape MD cameras from CHART export endpoint."""
    code = "MD"
    print(f"\n{'='*60}")
    print(f"Scraping Maryland - CHART Export JSON")
    url = "https://chart.maryland.gov/CARS/ExportJSON?type=camera"
    print(f"  URL: {url}")

    try:
        resp = api_ctx.get(url)
        if not resp.ok:
            print(f"  HTTP {resp.status} - skipping")
            return []
        data = resp.json()
    except Exception as e:
        print(f"  Error: {e}")
        return []

    cam_list = data if isinstance(data, list) else data.get("features", data.get("cameras", []))
    if isinstance(data, dict) and not cam_list:
        for key in data:
            if isinstance(data[key], list) and len(data[key]) > 10:
                cam_list = data[key]
                break

    print(f"  Raw entries: {len(cam_list)}")
    cameras = []

    for cam in cam_list:
        lat = cam.get("latitude") or cam.get("lat") or cam.get("y")
        lon = cam.get("longitude") or cam.get("lon") or cam.get("lng") or cam.get("x")

        if not lat or not lon:
            continue
        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue
        if abs(lat) > 90 or abs(lon) > 180:
            continue

        name = cam.get("description", "") or cam.get("name", "") or cam.get("location", "")
        route = cam.get("route", "") or cam.get("roadway", "") or cam.get("road", "")
        direction = cam.get("direction", "")

        hls_url = cam.get("hlsUrl", "") or cam.get("videoUrl", "") or cam.get("streamUrl", "")
        img_url = cam.get("imageUrl", "") or cam.get("url", "") or cam.get("snapshotUrl", "")

        stream_url = hls_url or img_url or ""
        stream_type = "hls" if (hls_url and "m3u8" in str(hls_url)) else "image_refresh"
        thumbnail = img_url or ""

        cam_id_raw = cam.get("id", "") or cam.get("cameraId", "")
        cam_id = f"md-chart-{cam_id_raw or len(cameras)}"

        cameras.append(make_camera(
            id=cam_id, name=name, lat=lat, lon=lon,
            state_name="Maryland", state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url=thumbnail, attribution="Maryland SHA CHART",
            highway=route, direction=direction,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Ohio - OHGO API
# ──────────────────────────────────────────────────────────────────────────────

def scrape_ohio(api_ctx):
    """Scrape OH cameras from OHGO.com API."""
    code = "OH"
    print(f"\n{'='*60}")
    print(f"Scraping Ohio - OHGO API")
    url = "https://publicapi.ohgo.com/api/v1/digital-signs"
    cameras_url = "https://publicapi.ohgo.com/api/v1/cameras"
    print(f"  URL: {cameras_url}")

    try:
        resp = api_ctx.get(cameras_url, headers={
            "Accept": "application/json",
        })
        if not resp.ok:
            print(f"  HTTP {resp.status} - trying alternate...")
            # Try alternate OHGO endpoint
            resp = api_ctx.get("https://www.ohgo.com/api/cameras", headers={
                "Accept": "application/json",
            })
            if not resp.ok:
                print(f"  HTTP {resp.status} - skipping Ohio")
                return []
        data = resp.json()
    except Exception as e:
        print(f"  Error: {e}")
        return []

    cam_list = data if isinstance(data, list) else data.get("results", data.get("cameras", data.get("features", [])))
    if isinstance(data, dict) and not cam_list:
        for key in data:
            if isinstance(data[key], list):
                cam_list = data[key]
                break

    print(f"  Raw entries: {len(cam_list)}")
    cameras = []

    for cam in cam_list:
        lat = cam.get("latitude") or cam.get("lat")
        lon = cam.get("longitude") or cam.get("lon") or cam.get("lng")

        if not lat or not lon:
            # Try nested location
            loc = cam.get("location", {})
            if isinstance(loc, dict):
                lat = loc.get("latitude") or loc.get("lat")
                lon = loc.get("longitude") or loc.get("lon")

        if not lat or not lon:
            continue
        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        name = cam.get("description", "") or cam.get("name", "") or cam.get("location", "")
        if isinstance(name, dict):
            name = name.get("description", "")

        route = cam.get("routeName", "") or cam.get("route", "")
        direction = cam.get("direction", "")

        # URLs
        small_url = cam.get("smallImageUrl", "") or cam.get("imageUrl", "") or cam.get("snapshotUrl", "")
        large_url = cam.get("largeImageUrl", "")
        hls_url = cam.get("hlsUrl", "") or cam.get("streamUrl", "")

        stream_url = hls_url or large_url or small_url or ""
        stream_type = "hls" if hls_url else "image_refresh"
        thumbnail = small_url or large_url or ""

        cam_id_raw = cam.get("id", "") or cam.get("cameraId", "")
        cam_id = f"oh-ohgo-{cam_id_raw or len(cameras)}"

        cameras.append(make_camera(
            id=cam_id, name=name if isinstance(name, str) else str(name), lat=lat, lon=lon,
            state_name="Ohio", state_code=code,
            stream_type=stream_type, stream_url=stream_url,
            thumbnail_url=thumbnail, attribution="ODOT / OHGO",
            highway=route, direction=direction,
        ))

    print(f"  Extracted {len(cameras)} cameras")
    return save_cameras(cameras, code)


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    state_filter = sys.argv[1].upper() if len(sys.argv) > 1 else None

    print("Starting camera scraper...")
    print(f"Output directory: {OUTPUT_DIR}")
    if state_filter:
        print(f"Filtering to state: {state_filter}")

    total_cameras = 0
    api_ctx = SimpleHTTP()

    # CARS Program states
    for cfg in CARS_STATES:
        if state_filter and cfg["code"] != state_filter:
            continue
        try:
            cameras = scrape_cars_state(api_ctx, cfg)
            total_cameras += len(cameras)
        except Exception as e:
            print(f"  FAILED {cfg['code']}: {e}")

    # Individual state scrapers
    scrapers = [
        ("SC", scrape_south_carolina),
        ("MO", scrape_missouri),
        ("CT", scrape_connecticut),
        ("OK", scrape_oklahoma),
        ("KY", scrape_kentucky),
        ("MD", scrape_maryland),
        ("OH", scrape_ohio),
    ]

    for code, scraper_fn in scrapers:
        if state_filter and code != state_filter:
            continue
        try:
            cameras = scraper_fn(api_ctx)
            total_cameras += len(cameras)
        except Exception as e:
            print(f"  FAILED {code}: {e}")

    print(f"\n{'='*60}")
    print(f"TOTAL: {total_cameras} cameras scraped")
    print(f"Output files in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
