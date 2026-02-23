#!/usr/bin/env python3
"""
Scrape cameras from newly discovered DOT APIs for states that lost cameras.
Virginia, Oregon, Colorado, Alabama.
"""
import json
import urllib.request
import ssl
import os
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json",
}


def fetch_json(url, headers=None, timeout=30):
    hdrs = dict(HEADERS)
    if headers:
        hdrs.update(headers)
    req = urllib.request.Request(url, headers=hdrs)
    resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return json.loads(resp.read().decode("utf-8"))


def check_url(cam):
    """Check if a camera URL is accessible."""
    url = cam.get("streamUrl") or cam.get("thumbnailUrl") or ""
    if not url or not url.startswith("http"):
        return cam, False
    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, timeout=8, context=ctx)
        return cam, resp.getcode() in (200, 301, 302, 307)
    except:
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "Mozilla/5.0")
            req.add_header("Range", "bytes=0-0")
            resp = urllib.request.urlopen(req, timeout=8, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False


def verify_batch(cameras, label=""):
    """Verify cameras in parallel."""
    if not cameras:
        return []
    working = []
    with ThreadPoolExecutor(max_workers=40) as pool:
        futures = {pool.submit(check_url, c): c for c in cameras}
        for f in as_completed(futures):
            cam, ok = f.result()
            if ok:
                working.append(cam)
    print(f"  {label}: {len(working)}/{len(cameras)} verified working")
    return working


# ============================================================
# Virginia (511.vdot.virginia.gov)
# ============================================================

def scrape_virginia():
    print("\n" + "=" * 60)
    print("Scraping Virginia (511.vdot.virginia.gov)...")

    cameras = []
    try:
        data = fetch_json("https://511.vdot.virginia.gov/services/map/array/cameras")

        # Handle different response formats
        if isinstance(data, dict):
            cam_list = data.get("data", data.get("features", data.get("cameras", [])))
        else:
            cam_list = data

        print(f"  Found {len(cam_list)} camera records")

        for cam in cam_list:
            props = cam.get("properties", cam)
            geom = cam.get("geometry", {})

            # Get coordinates
            lat = None
            lon = None
            coords = geom.get("coordinates", [])
            if len(coords) >= 2:
                try:
                    lon = float(coords[0])
                    lat = float(coords[1])
                except (ValueError, TypeError):
                    pass

            if not lat or not lon:
                lat = props.get("latitude")
                lon = props.get("longitude")

            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            if abs(lat) > 90 or abs(lon) > 180:
                continue

            cam_id = props.get("id", "")
            name = props.get("description", f"VA Camera {cam_id}")
            image_url = props.get("image_url", "")
            hls_url = props.get("https_url", props.get("ios_url", ""))
            route = props.get("route", "")
            direction = props.get("direction", "")
            active = props.get("active", True)

            if not active:
                continue

            stream_type = "hls" if hls_url else "image_refresh"
            stream_url = hls_url if hls_url else image_url

            cameras.append({
                "id": f"va-vdot-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": props.get("jurisdiction", ""),
                "state": "Virginia",
                "stateCode": "VA",
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": stream_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "VDOT / 511Virginia",
                "highway": route,
                "direction": direction,
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    return cameras


# ============================================================
# Oregon (tripcheck.com)
# ============================================================

def scrape_oregon():
    print("\n" + "=" * 60)
    print("Scraping Oregon (tripcheck.com)...")

    cameras = []
    try:
        # This returns Esri JSON format
        url = "https://www.tripcheck.com/Scripts/map/data/cctvinventory.js"
        req = urllib.request.Request(url, headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=30, context=ctx)
        raw = resp.read().decode("utf-8")

        # Parse as JSON (may have variable assignment wrapper)
        raw = raw.strip()
        if raw.startswith("var "):
            # Remove variable assignment
            eq_idx = raw.index("=")
            raw = raw[eq_idx + 1:].strip().rstrip(";")

        data = json.loads(raw)
        features = data.get("features", [])
        print(f"  Found {len(features)} camera records")

        for feat in features:
            attrs = feat.get("attributes", {})

            lat = attrs.get("latitude")
            lon = attrs.get("longitude")
            if not lat or not lon:
                geom = feat.get("geometry", {})
                # Web Mercator to WGS84 conversion if needed
                x = geom.get("x")
                y = geom.get("y")
                if x and y and abs(x) > 180:
                    import math
                    lon = x / 20037508.34 * 180
                    lat = (math.atan(math.exp(y / 20037508.34 * math.pi)) * 2 - math.pi / 2) * 180 / math.pi
                elif x and y:
                    lon, lat = x, y

            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            cam_id = attrs.get("cameraId", "")
            title = attrs.get("title", f"OR Camera {cam_id}")
            filename = attrs.get("filename", "")

            image_url = f"https://www.tripcheck.com/RoadCams/cams/{filename}" if filename else ""
            route = attrs.get("route", "")

            cameras.append({
                "id": f"or-tripcheck-{cam_id}",
                "name": title,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": "",
                "state": "Oregon",
                "stateCode": "OR",
                "source": "dot",
                "category": "traffic",
                "streamType": "image_refresh",
                "streamUrl": image_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "ODOT TripCheck",
                "highway": route,
                "direction": "",
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    return cameras


# ============================================================
# Colorado (carsprogram.org)
# ============================================================

def scrape_colorado():
    print("\n" + "=" * 60)
    print("Scraping Colorado (carsprogram.org)...")

    cameras = []
    try:
        data = fetch_json("https://cotg.carsprogram.org/cameras_v1/api/cameras")

        if not isinstance(data, list):
            data = data.get("data", data.get("cameras", []))

        print(f"  Found {len(data)} camera records")

        for cam in data:
            loc = cam.get("location", {})
            lat = loc.get("latitude")
            lon = loc.get("longitude")

            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            cam_id = cam.get("id", "")
            name = cam.get("name", f"CO Camera {cam_id}")
            active = cam.get("active", True)
            if not active:
                continue

            # Get best view URL
            views = cam.get("views", [])
            hls_url = ""
            thumb_url = ""
            if views:
                view = views[0]
                hls_url = view.get("url", "")
                thumb_url = view.get("videoPreviewUrl", view.get("snapshotUrl", ""))

            stream_type = "hls" if hls_url and "m3u8" in hls_url else "image_refresh"
            stream_url = hls_url if hls_url else thumb_url

            cameras.append({
                "id": f"co-cdot-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": "",
                "state": "Colorado",
                "stateCode": "CO",
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": stream_url,
                "thumbnailUrl": thumb_url,
                "isActive": True,
                "attribution": "CDOT / COtrip",
                "highway": loc.get("routeId", ""),
                "direction": "",
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    return cameras


# ============================================================
# Alabama (algotraffic.com)
# ============================================================

def scrape_alabama():
    print("\n" + "=" * 60)
    print("Scraping Alabama (algotraffic.com)...")

    cameras = []
    try:
        data = fetch_json("https://api.algotraffic.com/v4.0/Cameras")

        if not isinstance(data, list):
            data = data.get("data", data.get("cameras", []))

        print(f"  Found {len(data)} camera records")

        for cam in data:
            loc = cam.get("location", {})
            lat = loc.get("latitude")
            lon = loc.get("longitude")

            if not lat or not lon:
                lat = cam.get("latitude")
                lon = cam.get("longitude")

            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            cam_id = cam.get("id", "")
            name = loc.get("displayRouteDesignator", cam.get("name", f"AL Camera {cam_id}"))
            city = loc.get("city", "")
            direction = loc.get("direction", "")

            # Get stream URLs
            snapshot_url = cam.get("snapshotImageUrl", "")
            playback = cam.get("playbackUrls", {})
            hls_url = playback.get("hls", "")

            stream_type = "hls" if hls_url else "image_refresh"
            stream_url = hls_url if hls_url else snapshot_url

            cameras.append({
                "id": f"al-algo-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": city,
                "state": "Alabama",
                "stateCode": "AL",
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": stream_url,
                "thumbnailUrl": snapshot_url,
                "isActive": True,
                "attribution": "Alabama DOT / ALGO Traffic",
                "highway": loc.get("displayRouteDesignator", ""),
                "direction": direction,
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")
        import traceback
        traceback.print_exc()

    return cameras


# ============================================================
# Main
# ============================================================

def main():
    all_new = {}

    va = scrape_virginia()
    for c in va:
        all_new[c["id"]] = c

    or_cams = scrape_oregon()
    for c in or_cams:
        all_new[c["id"]] = c

    co = scrape_colorado()
    for c in co:
        all_new[c["id"]] = c

    al = scrape_alabama()
    for c in al:
        all_new[c["id"]] = c

    # Verify all new cameras
    print(f"\n{'=' * 60}")
    print(f"Verifying {len(all_new)} newly scraped cameras...")

    all_list = list(all_new.values())
    working = verify_batch(all_list, "ALL")

    # Group by state and save
    by_state = {}
    for cam in working:
        code = cam["stateCode"]
        if code not in by_state:
            by_state[code] = []
        by_state[code].append(cam)

    for code in sorted(by_state.keys()):
        cams = by_state[code]
        output = os.path.join(OUTPUT_DIR, f"{code.lower()}_recovery_cameras.json")
        with open(output, "w") as f:
            json.dump(cams, f, indent=2)
        print(f"  {code}: {len(cams)} verified cameras -> {output}")

    print(f"\n{'=' * 60}")
    print(f"TOTAL: {len(working)} verified cameras from recovery scrape")


if __name__ == "__main__":
    main()
