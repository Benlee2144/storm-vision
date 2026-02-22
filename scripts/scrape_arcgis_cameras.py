#!/usr/bin/env python3
"""
Scrape traffic cameras from state DOT ArcGIS Feature Servers.
Supports paginated queries for large datasets.
"""

import urllib.request
import json
import ssl
import time

OUTPUT_DIR = "scripts/output"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# ArcGIS Feature Server endpoints discovered via ArcGIS Online search
ARCGIS_STATES = [
    {
        "code": "IA",
        "name": "Iowa",
        "url": "https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0",
        "attribution": "Iowa DOT",
        "lat_field": None,  # auto-detect from geometry
        "lon_field": None,
        "name_field": "name",
        "image_field": "image_url",
    },
    {
        "code": "WA",
        "name": "Washington",
        "url": "https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0",
        "attribution": "WSDOT",
        "name_field": "title",
        "image_field": "imageurl",
    },
    {
        "code": "AL",
        "name": "Alabama",
        "url": "https://services7.arcgis.com/33Tmvrm3G2UZLFK9/arcgis/rest/services/AL_DOT_roadway_cameras/FeatureServer/0",
        "attribution": "Alabama DOT",
        "name_field": "title",
        "image_field": "url",
    },
    {
        "code": "HI",
        "name": "Hawaii",
        "url": "https://services.arcgis.com/6I1ysurtNWNxkuwd/arcgis/rest/services/HawaiiTrafficCameras/FeatureServer/0",
        "attribution": "Hawaii DOT",
        "name_field": "name",
        "image_field": "url",
    },
    {
        "code": "LA",
        "name": "Louisiana",
        "url": "https://services1.arcgis.com/fXHQyq63u0UsTeSM/arcgis/rest/services/DOTD_Traffic_Cameras/FeatureServer/0",
        "attribution": "Louisiana DOTD",
        "name_field": "name",
        "image_field": "image_url",
    },
    {
        "code": "AK",
        "name": "Alaska",
        "url": "https://services.arcgis.com/fX5IGselyy1TirdY/arcgis/rest/services/511_Cameras/FeatureServer/0",
        "attribution": "Alaska 511",
        "name_field": "Name",
        "image_field": "Url",
    },
    {
        "code": "GA",
        "name": "Georgia",
        "url": "https://services1.arcgis.com/2iUE8l8JKrP2tygQ/arcgis/rest/services/GDOT_511_Traffic_Cameras_Updated/FeatureServer/0",
        "attribution": "GDOT 511",
        "name_field": "Description",
        "image_field": "Url",
    },
    {
        "code": "FL",
        "name": "Florida",
        "url": "https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0",
        "attribution": "FDOT FL511",
        "name_field": "DESCRIPT",
        "image_field": "IMAGE",
    },
    {
        "code": "WY",
        "name": "Wyoming",
        "url": "https://services.arcgis.com/hRUr1F8lE8Jq2uJo/arcgis/rest/services/Wyoming_Traffic_Cameras_Cheyenne/FeatureServer/0",
        "attribution": "Wyoming DOT",
        "name_field": "Name",
        "image_field": "Camera_Link",
    },
    {
        "code": "CO",
        "name": "Colorado",
        "url": "https://services.arcgis.com/DO4gTjwJVIJ7O9Ca/ArcGIS/rest/services/CDOT_Traffic_Cameras_V2/FeatureServer/0",
        "attribution": "CDOT",
        "name_field": "CameraName",
        "image_field": "URL_Cam",
    },
    {
        "code": "MD",
        "name": "Maryland",
        "url": "https://chartimap1.sha.maryland.gov/arcgis/rest/services/CHART/Cameras/MapServer/0",
        "attribution": "Maryland SHA CHART",
        "name_field": "location",
        "image_field": "hlsurl",
    },
    {
        "code": "OR",
        "name": "Oregon",
        "url": "https://services.arcgis.com/uUvqNMGPm7axC2dD/arcgis/rest/services/TripCheck_Cameras/FeatureServer/0",
        "attribution": "ODOT TripCheck",
        "name_field": "attributes_title",
        "image_field": "attributes_filename",
    },
]

PAGE_SIZE = 1000


def fetch_json(url, timeout=30):
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })
    resp = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return json.loads(resp.read().decode("utf-8"))


def get_count(base_url):
    url = f"{base_url}/query?where=1%3D1&returnCountOnly=true&f=json"
    data = fetch_json(url)
    return data.get("count", 0)


def query_features(base_url, offset=0, limit=PAGE_SIZE):
    url = (
        f"{base_url}/query?where=1%3D1&outFields=*&outSR=4326"
        f"&resultOffset={offset}&resultRecordCount={limit}&f=json"
    )
    return fetch_json(url)


def find_field(attrs, candidates):
    """Find the first matching field name (case-insensitive)."""
    lower_map = {k.lower(): k for k in attrs.keys()}
    for c in candidates:
        if c.lower() in lower_map:
            return lower_map[c.lower()]
    return None


def extract_cameras(state_config, features):
    """Convert ArcGIS features to camera records."""
    cameras = []

    for feat in features:
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {})

        # Get coordinates
        lat = geom.get("y") or geom.get("latitude")
        lon = geom.get("x") or geom.get("longitude")

        if not lat or not lon:
            # Try from attributes
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

        if lat == 0 or lon == 0:
            continue
        if abs(lat) > 90 or abs(lon) > 180:
            continue

        # Find name field
        name_field = find_field(attrs, [
            state_config.get("name_field", "name"),
            "name", "title", "description", "location", "camera_name",
            "cameraname", "cam_name", "label"
        ])
        name = str(attrs.get(name_field, "")) if name_field else ""
        name = name.strip()

        # Find image/stream URL
        img_field = find_field(attrs, [
            state_config.get("image_field", "image_url"),
            "image_url", "imageurl", "url", "image", "snapshot_url",
            "snapshoturl", "thumbnail", "thumbnailurl", "camera_url",
            "videourl", "video_url", "streamurl", "stream_url", "link"
        ])
        img_url = str(attrs.get(img_field, "")) if img_field else ""

        # Find highway/route
        hwy_field = find_field(attrs, ["highway", "route", "road", "roadway", "road_name"])
        highway = str(attrs.get(hwy_field, "")) if hwy_field else ""

        # Find city
        city_field = find_field(attrs, ["city", "town", "municipality", "jurisdiction"])
        city = str(attrs.get(city_field, "")) if city_field else ""

        # Find direction
        dir_field = find_field(attrs, ["direction", "dir", "heading"])
        direction = str(attrs.get(dir_field, "")) if dir_field else ""

        # Determine stream type
        stream_type = "image_refresh"
        if img_url and ("m3u8" in img_url or "hls" in img_url.lower()):
            stream_type = "hls"

        # Generate ID
        oid_field = find_field(attrs, ["objectid", "fid", "id", "camera_id", "cameraid"])
        oid = attrs.get(oid_field, len(cameras)) if oid_field else len(cameras)

        if not name:
            name = f"{state_config['code']} Camera {oid}"

        cameras.append({
            "id": f"{state_config['code'].lower()}-arcgis-{oid}",
            "name": name,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city if city and city.lower() != "none" else "",
            "state": state_config["name"],
            "stateCode": state_config["code"],
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": img_url if img_url and img_url.lower() != "none" else "",
            "thumbnailUrl": img_url if img_url and img_url.lower() != "none" else "",
            "isActive": True,
            "attribution": state_config["attribution"],
            "highway": highway if highway and highway.lower() != "none" else "",
            "direction": direction if direction and direction.lower() != "none" else "",
        })

    return cameras


def scrape_state(state_config):
    code = state_config["code"]
    base_url = state_config["url"]

    print(f"\n{'='*50}")
    print(f"Scraping {state_config['name']} ({code})...")
    print(f"  URL: {base_url}")

    try:
        total = get_count(base_url)
        print(f"  Total features: {total}")
    except Exception as e:
        print(f"  Error getting count: {e}")
        return []

    all_features = []
    offset = 0

    while offset < total:
        try:
            data = query_features(base_url, offset, PAGE_SIZE)
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

    # Show sample fields for debugging
    if all_features:
        sample = all_features[0]
        print(f"  Sample fields: {list(sample.get('attributes', {}).keys())[:12]}")

    cameras = extract_cameras(state_config, all_features)
    print(f"  Extracted {len(cameras)} cameras")

    # Save
    output_file = f"{OUTPUT_DIR}/{code.lower()}_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)
    print(f"  Saved to {output_file}")

    return cameras


def main():
    import sys
    state_filter = sys.argv[1].upper() if len(sys.argv) > 1 else None

    total_cameras = 0
    for state in ARCGIS_STATES:
        if state_filter and state["code"] != state_filter:
            continue
        cameras = scrape_state(state)
        total_cameras += len(cameras)

    print(f"\n{'='*50}")
    print(f"TOTAL: {total_cameras} cameras scraped from ArcGIS")


if __name__ == "__main__":
    main()
