#!/usr/bin/env python3
"""
Comprehensive DOT camera scraper for all underserved states.
Scrapes cameras from multiple state DOT APIs and outputs per-state JSON files.
"""
import json
import urllib.request
import ssl
import time
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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
}


def fetch_json(url, headers=None, data=None, timeout=30):
    """Fetch JSON from a URL with optional POST data."""
    hdrs = dict(HEADERS)
    if headers:
        hdrs.update(headers)
    if data and isinstance(data, str):
        data = data.encode()
    req = urllib.request.Request(url, data=data, headers=hdrs)
    resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return json.loads(resp.read().decode("utf-8"))


def parse_wkt_point(latlng_obj):
    """Extract lat/lng from 511 wellKnownText format."""
    if not latlng_obj:
        return None, None
    geo = latlng_obj.get("geography", {})
    wkt = geo.get("wellKnownText", "")
    m = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", wkt)
    if m:
        return float(m.group(2)), float(m.group(1))  # lat, lon
    return None, None


# ============================================================
# 511 Platform Scrapers (ibiGroup / TransCore)
# ============================================================

STATES_511 = [
    {
        "code": "CT", "name": "Connecticut",
        "url": "https://www.ctroads.org/List/GetData/Cameras",
        "referer": "https://www.ctroads.org/",
        "image_base": "https://www.ctroads.org",
        "attribution": "ConnDOT / CTRoads",
    },
    {
        "code": "NE511", "name": "New England",
        "url": "https://newengland511.org/List/GetData/Cameras",
        "referer": "https://newengland511.org/",
        "image_base": "https://newengland511.org",
        "attribution": "New England 511",
        "multi_state": True,
    },
    {
        "code": "LA", "name": "Louisiana",
        "url": "https://www.511la.org/List/GetData/Cameras",
        "referer": "https://www.511la.org/",
        "image_base": "https://www.511la.org",
        "attribution": "LADOTD / 511LA",
    },
    {
        "code": "WI", "name": "Wisconsin",
        "url": "https://511wi.gov/List/GetData/Cameras",
        "referer": "https://511wi.gov/",
        "image_base": "https://511wi.gov",
        "attribution": "WisDOT / 511WI",
    },
    {
        "code": "FL", "name": "Florida",
        "url": "https://fl511.com/List/GetData/Cameras",
        "referer": "https://fl511.com/",
        "image_base": "https://fl511.com",
        "attribution": "FDOT / FL511",
    },
    {
        "code": "GA", "name": "Georgia",
        "url": "https://511ga.org/List/GetData/Cameras",
        "referer": "https://511ga.org/",
        "image_base": "https://511ga.org",
        "attribution": "GDOT / 511GA",
    },
    {
        "code": "NY", "name": "New York",
        "url": "https://511ny.org/List/GetData/Cameras",
        "referer": "https://511ny.org/",
        "image_base": "https://511ny.org",
        "attribution": "NYSDOT / 511NY",
    },
    {
        "code": "PA", "name": "Pennsylvania",
        "url": "https://511pa.com/List/GetData/Cameras",
        "referer": "https://511pa.com/",
        "image_base": "https://511pa.com",
        "attribution": "PennDOT / 511PA",
    },
    {
        "code": "AZ", "name": "Arizona",
        "url": "https://az511.com/List/GetData/Cameras",
        "referer": "https://az511.com/",
        "image_base": "https://az511.com",
        "attribution": "ADOT / AZ511",
    },
    {
        "code": "ID", "name": "Idaho",
        "url": "https://511.idaho.gov/List/GetData/Cameras",
        "referer": "https://511.idaho.gov/",
        "image_base": "https://511.idaho.gov",
        "attribution": "ITD / 511 Idaho",
    },
    {
        "code": "UT", "name": "Utah",
        "url": "https://udottraffic.utah.gov/List/GetData/Cameras",
        "referer": "https://udottraffic.utah.gov/",
        "image_base": "https://udottraffic.utah.gov",
        "attribution": "UDOT Traffic",
    },
    {
        "code": "NV", "name": "Nevada",
        "url": "https://www.nvroads.com/List/GetData/Cameras",
        "referer": "https://www.nvroads.com/",
        "image_base": "https://www.nvroads.com",
        "attribution": "NDOT / NVRoads",
    },
]

# State name -> state code mapping for multi-state endpoints
STATE_NAME_TO_CODE = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC"
}


def scrape_511(state_config, page_size=100):
    """Scrape cameras from a 511 POST endpoint with pagination."""
    cameras = []
    start = 0
    total = None
    draw = 1

    while True:
        body = (
            f"draw={draw}&columns%5B0%5D%5Bdata%5D=cameras&start={start}&length={page_size}"
        )
        headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": state_config["referer"],
            "X-Requested-With": "XMLHttpRequest",
        }

        try:
            data = fetch_json(state_config["url"], headers=headers, data=body)
        except Exception as e:
            print(f"  Error at offset {start}: {e}")
            break

        batch = data.get("data", [])
        if total is None:
            total = data.get("recordsTotal", 0)
            print(f"  Total cameras reported: {total}")

        if not batch:
            break

        draw += 1

        for cam in batch:
            lat, lon = parse_wkt_point(cam.get("latLng"))
            if lat is None or lon is None:
                continue

            # Get state from camera data (for multi-state endpoints)
            cam_state = cam.get("state", state_config["name"])
            state_code = STATE_NAME_TO_CODE.get(cam_state, state_config["code"])

            # Get stream info
            images = cam.get("images", [])
            stream_type = "image_refresh"
            stream_url = ""
            thumbnail_url = ""

            if images:
                img = images[0]
                video_url = img.get("videoUrl", "")
                image_url = img.get("imageUrl", "")

                if image_url and not image_url.startswith("http"):
                    image_url = state_config["image_base"] + image_url
                if video_url and ("m3u8" in video_url or not img.get("isVideoAuthRequired", False)):
                    stream_type = "hls"
                    stream_url = video_url
                    thumbnail_url = image_url
                else:
                    stream_url = image_url
                    thumbnail_url = image_url

            roadway = cam.get("roadway", "")
            direction = cam.get("direction", "")
            location = cam.get("location", "")
            name = location or f"{roadway} {direction}".strip()
            name = name.replace("_", " ").strip()
            if not name:
                name = f"Camera {cam.get('id', start)}"

            camera_id = f"{state_code.lower()}-511-{cam.get('id', start)}"

            cameras.append({
                "id": camera_id,
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": "",
                "state": cam_state,
                "stateCode": state_code,
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": stream_url,
                "thumbnailUrl": thumbnail_url,
                "isActive": True,
                "attribution": state_config["attribution"],
                "highway": roadway,
                "direction": direction,
            })

        start += len(batch)
        print(f"  Scraped {start} / {total} cameras...")
        if start >= total:
            break
        time.sleep(0.3)

    return cameras


# ============================================================
# Oklahoma DOT (oktraffic.org)
# ============================================================

def scrape_oklahoma():
    """Scrape cameras from Oklahoma's oktraffic.org API."""
    print("\n" + "=" * 60)
    print("Scraping Oklahoma (oktraffic.org)...")

    cameras = []
    try:
        # Get devices (filter for cameras: deviceTypeNameId=2)
        devices = fetch_json("https://www.oktraffic.org/api/devices")
        addresses = fetch_json("https://www.oktraffic.org/api/addresses")

        # Build address lookup
        addr_map = {}
        for addr in addresses:
            addr_map[str(addr.get("id", ""))] = addr

        cam_devices = [d for d in devices if str(d.get("deviceTypeNameId", "")) == "2"]
        print(f"  Found {len(cam_devices)} camera devices out of {len(devices)} total")

        for dev in cam_devices:
            addr_id = str(dev.get("addressId", ""))
            addr = addr_map.get(addr_id, {})

            lat = addr.get("latitude")
            lon = addr.get("longitude")
            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            dev_id = dev.get("id", "")
            name = addr.get("name", f"OK Camera {dev_id}")
            city = addr.get("city", "")

            image_url = f"https://www.oktraffic.org/cameraImages/{dev_id}.jpg"

            cameras.append({
                "id": f"ok-dot-{dev_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": city if city else "",
                "state": "Oklahoma",
                "stateCode": "OK",
                "source": "dot",
                "category": "traffic",
                "streamType": "image_refresh",
                "streamUrl": image_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "Oklahoma DOT / OKTraffic",
                "highway": "",
                "direction": addr.get("direction", ""),
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# New Mexico DOT (nmroads.com)
# ============================================================

def scrape_new_mexico():
    """Scrape cameras from New Mexico's nmroads.com API."""
    print("\n" + "=" * 60)
    print("Scraping New Mexico (nmroads.com)...")

    cameras = []
    try:
        data = fetch_json("https://servicev5.nmroads.com/RealMapWAR/GetCameraInfo")
        cam_list = data if isinstance(data, list) else data.get("cameraInfo", data.get("cameras", []))

        print(f"  Found {len(cam_list)} camera records")

        for cam in cam_list:
            if not cam.get("enabled", True):
                continue

            lat = cam.get("lat")
            lon = cam.get("lon")
            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            title = cam.get("title", "NM Camera")
            snapshot = cam.get("snapshotFile", "")
            cam_id = cam.get("id", title.replace(" ", "_"))

            cameras.append({
                "id": f"nm-dot-{cam_id}",
                "name": title,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": cam.get("grouping", ""),
                "state": "New Mexico",
                "stateCode": "NM",
                "source": "dot",
                "category": "traffic",
                "streamType": "image_refresh",
                "streamUrl": snapshot,
                "thumbnailUrl": snapshot,
                "isActive": True,
                "attribution": "NMDOT / NMRoads",
                "highway": "",
                "direction": "",
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# North Carolina DOT (eapps.ncdot.gov)
# ============================================================

def scrape_north_carolina():
    """Scrape cameras from North Carolina DOT API."""
    print("\n" + "=" * 60)
    print("Scraping North Carolina (eapps.ncdot.gov)...")

    cameras = []
    try:
        data = fetch_json("https://eapps.ncdot.gov/services/traffic-prod/v1/cameras")
        if not isinstance(data, list):
            data = data.get("cameras", data.get("data", []))

        print(f"  Found {len(data)} camera records")

        for cam in data:
            lat = cam.get("latitude")
            lon = cam.get("longitude")
            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            status = cam.get("status", "")
            if status and status.upper() not in ("OK", "ACTIVE", "ONLINE"):
                continue

            cam_id = cam.get("id", "")
            name = cam.get("locationName", cam.get("name", f"NC Camera {cam_id}"))
            image_url = cam.get("imageURL", "")

            cameras.append({
                "id": f"nc-dot-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": cam.get("city", ""),
                "state": "North Carolina",
                "stateCode": "NC",
                "source": "dot",
                "category": "traffic",
                "streamType": "image_refresh",
                "streamUrl": image_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "NCDOT",
                "highway": cam.get("routeName", ""),
                "direction": cam.get("direction", ""),
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# Maryland CHART (chart.maryland.gov)
# ============================================================

def scrape_maryland():
    """Scrape cameras from Maryland's CHART system."""
    print("\n" + "=" * 60)
    print("Scraping Maryland (chart.maryland.gov)...")

    cameras = []
    try:
        data = fetch_json(
            "https://chartexp1.sha.maryland.gov/CHARTExportClientService/getCameraMapDataJSON.do"
        )
        cam_list = data.get("data", data) if isinstance(data, dict) else data

        print(f"  Found {len(cam_list)} camera records")

        for cam in cam_list:
            lat = cam.get("lat")
            lon = cam.get("lon")
            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            cam_id = cam.get("cameraId", cam.get("id", ""))
            name = cam.get("name", cam.get("description", f"MD Camera {cam_id}"))
            video_url = cam.get("publicVideoURL", cam.get("videoURL", ""))

            # Determine stream type
            stream_type = "image_refresh"
            if video_url and ("m3u8" in video_url or "Video/GetVideo" in video_url):
                stream_type = "hls"

            cameras.append({
                "id": f"md-chart-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": "",
                "state": "Maryland",
                "stateCode": "MD",
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": video_url,
                "thumbnailUrl": "",
                "isActive": True,
                "attribution": "Maryland SHA CHART",
                "highway": cam.get("routeNumber", ""),
                "direction": cam.get("direction", ""),
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# ArcGIS Feature Server Scrapers
# ============================================================

ARCGIS_STATES = [
    {
        "code": "IA", "name": "Iowa",
        "url": "https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0",
        "attribution": "Iowa DOT",
        "name_field": "name", "image_field": "image_url",
    },
    {
        "code": "WA", "name": "Washington",
        "url": "https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0",
        "attribution": "WSDOT",
        "name_field": "title", "image_field": "imageurl",
    },
    {
        "code": "AL", "name": "Alabama",
        "url": "https://services7.arcgis.com/33Tmvrm3G2UZLFK9/arcgis/rest/services/AL_DOT_roadway_cameras/FeatureServer/0",
        "attribution": "Alabama DOT",
        "name_field": "title", "image_field": "url",
    },
    {
        "code": "HI", "name": "Hawaii",
        "url": "https://services.arcgis.com/6I1ysurtNWNxkuwd/arcgis/rest/services/HawaiiTrafficCameras/FeatureServer/0",
        "attribution": "Hawaii DOT",
        "name_field": "name", "image_field": "url",
    },
    {
        "code": "AK", "name": "Alaska",
        "url": "https://services.arcgis.com/fX5IGselyy1TirdY/arcgis/rest/services/511_Cameras/FeatureServer/0",
        "attribution": "Alaska 511",
        "name_field": "Name", "image_field": "Url",
    },
    {
        "code": "WY", "name": "Wyoming",
        "url": "https://services.arcgis.com/hRUr1F8lE8Jq2uJo/arcgis/rest/services/Wyoming_Traffic_Cameras_Cheyenne/FeatureServer/0",
        "attribution": "Wyoming DOT",
        "name_field": "Name", "image_field": "Camera_Link",
    },
    {
        "code": "CO", "name": "Colorado",
        "url": "https://services.arcgis.com/DO4gTjwJVIJ7O9Ca/ArcGIS/rest/services/CDOT_Traffic_Cameras_V2/FeatureServer/0",
        "attribution": "CDOT",
        "name_field": "CameraName", "image_field": "URL_Cam",
    },
    {
        "code": "OR", "name": "Oregon",
        "url": "https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TripCheck_Cameras/FeatureServer/0",
        "attribution": "ODOT TripCheck",
        "name_field": "attributes_title", "image_field": "attributes_filename",
    },
    {
        "code": "KS", "name": "Kansas",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/Kandrive_Camera_Locations/FeatureServer/0",
        "attribution": "KDOT / KanDrive",
        "name_field": "SignDescription", "image_field": "CameraUrl",
    },
    {
        "code": "SC", "name": "South Carolina",
        "url": "https://services1.arcgis.com/VaY7cIcMhq86lD5S/arcgis/rest/services/SCDOT_Traffic_Cameras/FeatureServer/0",
        "attribution": "SCDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "MN", "name": "Minnesota",
        "url": "https://services.arcgis.com/BG6nSlhZSAWtExvp/arcgis/rest/services/MnDOT_CCTV_Camera_Inventory/FeatureServer/0",
        "attribution": "MnDOT",
        "name_field": "Description", "image_field": "URL",
    },
    {
        "code": "OH", "name": "Ohio",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/OHGO_Camera_Locations/FeatureServer/0",
        "attribution": "ODOT / OHGO",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "IN", "name": "Indiana",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/INDOT_TrafficWise_Camera_Locations/FeatureServer/0",
        "attribution": "INDOT TrafficWise",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "KY", "name": "Kentucky",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/KYTC_GoKY_Camera_Locations/FeatureServer/0",
        "attribution": "KYTC / GoKY",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "MO", "name": "Missouri",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/MoDOT_Traveler_Info_Camera_Locations/FeatureServer/0",
        "attribution": "MoDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "DE", "name": "Delaware",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/DelDOT_Camera_Locations/FeatureServer/0",
        "attribution": "DelDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "TX", "name": "Texas",
        "url": "https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_Camera_Locations/FeatureServer/0",
        "attribution": "TxDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "ND", "name": "North Dakota",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/ND_DOT_Camera_Locations/FeatureServer/0",
        "attribution": "NDDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "SD", "name": "South Dakota",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/SD_DOT_Camera_Locations/FeatureServer/0",
        "attribution": "SDDOT",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "NE", "name": "Nebraska",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/NDOR_511_Camera_Locations/FeatureServer/0",
        "attribution": "NDOR / NE 511",
        "name_field": "Description", "image_field": "Url",
    },
    {
        "code": "MT", "name": "Montana",
        "url": "https://services.arcgis.com/RlaoYMAJEXkSiGdD/arcgis/rest/services/MDT_511_Camera_Locations/FeatureServer/0",
        "attribution": "MDT / MT 511",
        "name_field": "Description", "image_field": "Url",
    },
]

PAGE_SIZE = 2000


def find_field(attrs, candidates):
    """Find the first matching field name (case-insensitive)."""
    lower_map = {k.lower(): k for k in attrs.keys()}
    for c in candidates:
        if c.lower() in lower_map:
            return lower_map[c.lower()]
    return None


def scrape_arcgis(state_config):
    """Scrape cameras from an ArcGIS Feature Server."""
    code = state_config["code"]
    base_url = state_config["url"]

    print(f"\n{'=' * 50}")
    print(f"Scraping {state_config['name']} ({code}) via ArcGIS...")
    print(f"  URL: {base_url}")

    try:
        count_url = f"{base_url}/query?where=1%3D1&returnCountOnly=true&f=json"
        count_data = fetch_json(count_url)
        total = count_data.get("count", 0)
        print(f"  Total features: {total}")
    except Exception as e:
        print(f"  Error getting count: {e}")
        return []

    all_features = []
    offset = 0

    while offset < max(total, 1):
        try:
            query_url = (
                f"{base_url}/query?where=1%3D1&outFields=*&outSR=4326"
                f"&resultOffset={offset}&resultRecordCount={PAGE_SIZE}&f=json"
            )
            data = fetch_json(query_url)
            features = data.get("features", [])
            if not features:
                break
            all_features.extend(features)
            offset += len(features)
            print(f"  Fetched {len(all_features)}/{total}...")

            if not data.get("exceededTransferLimit", False) and len(features) < PAGE_SIZE:
                break
            time.sleep(0.3)
        except Exception as e:
            print(f"  Error at offset {offset}: {e}")
            break

    if all_features:
        sample = all_features[0]
        print(f"  Sample fields: {list(sample.get('attributes', {}).keys())[:10]}")

    cameras = []
    for feat in all_features:
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {})

        lat = geom.get("y") or geom.get("latitude")
        lon = geom.get("x") or geom.get("longitude")

        if not lat or not lon:
            lat_field = find_field(attrs, ["latitude", "lat", "y", "point_y"])
            lon_field = find_field(attrs, ["longitude", "lon", "lng", "x", "point_x"])
            if lat_field and lon_field:
                lat = attrs.get(lat_field)
                lon = attrs.get(lon_field)

        if not lat or not lon:
            continue
        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue
        if lat == 0 or lon == 0 or abs(lat) > 90 or abs(lon) > 180:
            continue

        name_field = find_field(attrs, [
            state_config.get("name_field", "name"),
            "name", "title", "description", "location", "camera_name",
            "cameraname", "cam_name", "label", "signdescription"
        ])
        name = str(attrs.get(name_field, "")) if name_field else ""
        name = name.strip()

        img_field = find_field(attrs, [
            state_config.get("image_field", "image_url"),
            "image_url", "imageurl", "url", "image", "snapshot_url",
            "snapshoturl", "thumbnail", "thumbnailurl", "camera_url",
            "videourl", "video_url", "streamurl", "stream_url", "link",
            "cameraurl", "camera_link"
        ])
        img_url = str(attrs.get(img_field, "")) if img_field else ""

        hwy_field = find_field(attrs, ["highway", "route", "road", "roadway", "road_name", "routename"])
        highway = str(attrs.get(hwy_field, "")) if hwy_field else ""

        city_field = find_field(attrs, ["city", "town", "municipality", "jurisdiction", "county"])
        city = str(attrs.get(city_field, "")) if city_field else ""

        dir_field = find_field(attrs, ["direction", "dir", "heading"])
        direction = str(attrs.get(dir_field, "")) if dir_field else ""

        stream_type = "image_refresh"
        if img_url and ("m3u8" in img_url or "hls" in img_url.lower()):
            stream_type = "hls"

        oid_field = find_field(attrs, ["objectid", "fid", "id", "camera_id", "cameraid"])
        oid = attrs.get(oid_field, len(cameras)) if oid_field else len(cameras)

        if not name:
            name = f"{code} Camera {oid}"

        # Clean None values
        for val_name in [city, highway, direction, name]:
            if val_name and val_name.lower() in ("none", "null", "n/a"):
                val_name = ""

        cameras.append({
            "id": f"{code.lower()}-arcgis-{oid}",
            "name": name if name.lower() not in ("none", "null") else f"{code} Camera {oid}",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city if city and city.lower() not in ("none", "null") else "",
            "state": state_config["name"],
            "stateCode": code,
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": img_url if img_url and img_url.lower() not in ("none", "null") else "",
            "thumbnailUrl": img_url if img_url and img_url.lower() not in ("none", "null") else "",
            "isActive": True,
            "attribution": state_config["attribution"],
            "highway": highway if highway and highway.lower() not in ("none", "null") else "",
            "direction": direction if direction and direction.lower() not in ("none", "null") else "",
        })

    print(f"  Extracted {len(cameras)} cameras")
    return cameras


# ============================================================
# Texas DOT (DriveTexas)
# ============================================================

def scrape_texas_drivetexas():
    """Scrape cameras from TxDOT's DriveTexas API."""
    print("\n" + "=" * 60)
    print("Scraping Texas (DriveTexas GeoJSON)...")

    cameras = []
    try:
        data = fetch_json(
            "https://its.txdot.gov/its/DistrictInfo/GetCCTVForMap"
        )
        if isinstance(data, list):
            cam_list = data
        else:
            cam_list = data.get("features", data.get("cameras", data.get("data", [])))

        print(f"  Found {len(cam_list)} camera records")

        for cam in cam_list:
            # Handle both flat and nested formats
            props = cam.get("properties", cam)
            geom = cam.get("geometry", {})

            lat = props.get("latitude", props.get("lat"))
            lon = props.get("longitude", props.get("lon", props.get("lng")))

            if not lat and geom:
                coords = geom.get("coordinates", [])
                if len(coords) >= 2:
                    lon, lat = coords[0], coords[1]

            if not lat or not lon:
                continue
            try:
                lat = float(lat)
                lon = float(lon)
            except (ValueError, TypeError):
                continue

            cam_id = props.get("cctvId", props.get("id", ""))
            name = props.get("description", props.get("name", f"TX Camera {cam_id}"))
            image_url = props.get("imageUrl", props.get("url", ""))

            cameras.append({
                "id": f"tx-dot-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": props.get("city", ""),
                "state": "Texas",
                "stateCode": "TX",
                "source": "dot",
                "category": "traffic",
                "streamType": "hls" if image_url and "m3u8" in image_url else "image_refresh",
                "streamUrl": image_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "TxDOT / DriveTexas",
                "highway": props.get("roadway", ""),
                "direction": props.get("direction", ""),
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# Ohio (OHGO)
# ============================================================

def scrape_ohio():
    """Scrape cameras from Ohio's OHGO API."""
    print("\n" + "=" * 60)
    print("Scraping Ohio (OHGO)...")

    cameras = []
    try:
        data = fetch_json(
            "https://publicapi.ohgo.com/api/v1/digital-signs",
            headers={"Accept": "application/json"}
        )
    except:
        pass

    try:
        data = fetch_json(
            "https://publicapi.ohgo.com/api/v1/cameras",
            headers={"Accept": "application/json"}
        )
        cam_list = data.get("results", data) if isinstance(data, dict) else data
        print(f"  Found {len(cam_list)} camera records")

        for cam in cam_list:
            lat = cam.get("latitude")
            lon = cam.get("longitude")
            if not lat or not lon:
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

            cam_id = cam.get("id", cam.get("cameraId", ""))
            name = cam.get("description", cam.get("name", f"OH Camera {cam_id}"))

            # Get image URLs from camera views
            views = cam.get("cameraViews", cam.get("views", []))
            image_url = ""
            if views and len(views) > 0:
                view = views[0]
                image_url = view.get("smallUrl", view.get("largeUrl", view.get("url", "")))

            cameras.append({
                "id": f"oh-ohgo-{cam_id}",
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": cam.get("city", cam.get("county", "")),
                "state": "Ohio",
                "stateCode": "OH",
                "source": "dot",
                "category": "traffic",
                "streamType": "hls" if image_url and "m3u8" in image_url else "image_refresh",
                "streamUrl": image_url,
                "thumbnailUrl": image_url,
                "isActive": True,
                "attribution": "ODOT / OHGO",
                "highway": cam.get("routeName", ""),
                "direction": cam.get("direction", ""),
            })

        print(f"  Extracted {len(cameras)} cameras")
    except Exception as e:
        print(f"  Error: {e}")

    return cameras


# ============================================================
# Mississippi DOT (mdottraffic.com)
# ============================================================

def scrape_mississippi():
    """Scrape cameras from Mississippi DOT."""
    print("\n" + "=" * 60)
    print("Scraping Mississippi (mdottraffic.com)...")

    cameras = []
    # Try multiple potential endpoints
    urls = [
        "https://api.mdottraffic.com/prod/v3/cameras",
        "https://api.mdottraffic.com/prod/v2/cameras",
        "https://mdottraffic.com/api/cameras",
    ]
    for url in urls:
        try:
            data = fetch_json(url)
            cam_list = data if isinstance(data, list) else data.get("data", data.get("cameras", []))
            if cam_list:
                print(f"  Found {len(cam_list)} cameras from {url}")
                for cam in cam_list:
                    lat = cam.get("latitude", cam.get("lat"))
                    lon = cam.get("longitude", cam.get("lon", cam.get("lng")))
                    if not lat or not lon:
                        continue
                    cam_id = cam.get("id", cam.get("cameraId", ""))
                    name = cam.get("name", cam.get("description", f"MS Camera {cam_id}"))
                    image_url = cam.get("imageUrl", cam.get("url", ""))
                    cameras.append({
                        "id": f"ms-dot-{cam_id}",
                        "name": name,
                        "latitude": round(float(lat), 6),
                        "longitude": round(float(lon), 6),
                        "city": cam.get("city", ""),
                        "state": "Mississippi",
                        "stateCode": "MS",
                        "source": "dot",
                        "category": "traffic",
                        "streamType": "image_refresh",
                        "streamUrl": image_url,
                        "thumbnailUrl": image_url,
                        "isActive": True,
                        "attribution": "MDOT Traffic",
                    })
                break
        except Exception as e:
            print(f"  {url}: {e}")

    if not cameras:
        print("  Could not access Mississippi DOT API (may be down)")

    return cameras


# ============================================================
# Verification
# ============================================================

def verify_camera(cam):
    """Check if a camera URL is accessible."""
    url = cam.get("streamUrl") or cam.get("thumbnailUrl") or ""
    if not url or not url.startswith("http"):
        return cam, False

    try:
        req = urllib.request.Request(url, method="HEAD")
        req.add_header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
        resp = urllib.request.urlopen(req, timeout=8, context=ctx)
        return cam, resp.getcode() in (200, 301, 302)
    except:
        try:
            req = urllib.request.Request(url)
            req.add_header("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")
            req.add_header("Range", "bytes=0-0")
            resp = urllib.request.urlopen(req, timeout=8, context=ctx)
            return cam, resp.getcode() in (200, 206)
        except:
            return cam, False


def verify_cameras(cameras, max_workers=30):
    """Verify a list of cameras in parallel. Returns only working cameras."""
    if not cameras:
        return []

    working = []
    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(verify_camera, c): c for c in cameras}
        done = 0
        for f in as_completed(futures):
            cam, ok = f.result()
            done += 1
            if ok:
                working.append(cam)
            if done % 100 == 0:
                print(f"    Verified {done}/{len(cameras)}... ({len(working)} working)")

    return working


# ============================================================
# Main
# ============================================================

def main():
    all_cameras = {}
    state_filter = sys.argv[1].upper() if len(sys.argv) > 1 else None

    print("=" * 60)
    print("COMPREHENSIVE DOT CAMERA SCRAPER")
    print("=" * 60)

    # 1. Scrape 511 platform states
    print("\n\n### SCRAPING 511 PLATFORM STATES ###\n")
    for state in STATES_511:
        if state_filter and state["code"] != state_filter:
            continue
        try:
            print(f"\n{'=' * 60}")
            print(f"Scraping {state['name']} ({state['code']})...")
            cameras = scrape_511(state)
            print(f"  DONE: {len(cameras)} cameras")
            for cam in cameras:
                if cam["id"] and cam["latitude"] != 0:
                    all_cameras[cam["id"]] = cam
        except Exception as e:
            print(f"  FAILED: {e}")

    # 2. Scrape ArcGIS states
    print("\n\n### SCRAPING ARCGIS STATES ###\n")
    for state in ARCGIS_STATES:
        if state_filter and state["code"] != state_filter:
            continue
        try:
            cameras = scrape_arcgis(state)
            for cam in cameras:
                if cam["id"] and cam["latitude"] != 0:
                    all_cameras[cam["id"]] = cam
        except Exception as e:
            print(f"  {state['code']} FAILED: {e}")

    # 3. Scrape custom API states
    if not state_filter or state_filter == "OK":
        cameras = scrape_oklahoma()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "NM":
        cameras = scrape_new_mexico()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "NC":
        cameras = scrape_north_carolina()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "MD":
        cameras = scrape_maryland()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "TX":
        cameras = scrape_texas_drivetexas()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "OH":
        cameras = scrape_ohio()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    if not state_filter or state_filter == "MS":
        cameras = scrape_mississippi()
        for cam in cameras:
            all_cameras[cam["id"]] = cam

    # Group by state
    by_state = {}
    for cam in all_cameras.values():
        code = cam.get("stateCode", "")
        if not code or code in ("NE511",):
            continue
        if code not in by_state:
            by_state[code] = []
        by_state[code].append(cam)

    # Save per-state files
    print(f"\n\n{'=' * 60}")
    print("RESULTS BY STATE:")
    print("=" * 60)

    total = 0
    for code in sorted(by_state.keys()):
        cams = by_state[code]
        total += len(cams)
        output_file = os.path.join(OUTPUT_DIR, f"{code.lower()}_cameras.json")
        with open(output_file, "w") as f:
            json.dump(cams, f, indent=2)
        print(f"  {code}: {len(cams):>5} cameras -> {output_file}")

    print(f"\n{'=' * 60}")
    print(f"TOTAL: {total:,} cameras scraped across {len(by_state)} states")
    print(f"Output directory: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
