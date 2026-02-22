#!/usr/bin/env python3
"""
Scrape Illinois DOT camera data from ArcGIS FeatureServer.
Public endpoint, no auth required. Returns ~3,671 cameras.
Paginated at 1000 records per request.
"""

import urllib.request
import json

OUTPUT_DIR = "scripts/output"

BASE_URL = "https://services2.arcgis.com/aIrBD8yn1TDTEXoz/arcgis/rest/services/TrafficCamerasTM_Public/FeatureServer/0/query"
PAGE_SIZE = 1000


def fetch_page(offset):
    """Fetch a page of cameras from ArcGIS."""
    params = f"where=1%3D1&outFields=*&f=json&resultRecordCount={PAGE_SIZE}&resultOffset={offset}&returnGeometry=true"
    url = f"{BASE_URL}?{params}"

    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })

    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read().decode("utf-8"))


def main():
    print("Scraping Illinois DOT cameras from ArcGIS...")

    all_features = []
    offset = 0

    while True:
        print(f"  Fetching offset {offset}...")
        data = fetch_page(offset)
        features = data.get("features", [])
        all_features.extend(features)
        print(f"    Got {len(features)} records (total: {len(all_features)})")

        if not data.get("exceededTransferLimit", False) or len(features) == 0:
            break
        offset += PAGE_SIZE

    print(f"\n  Total raw records: {len(all_features)}")

    cameras = []
    for feat in all_features:
        attrs = feat.get("attributes", {})
        geom = feat.get("geometry", {})

        lat = attrs.get("y") or geom.get("y")
        lon = attrs.get("x") or geom.get("x")

        if not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        if lat == 0 or lon == 0:
            continue

        name = attrs.get("CameraLocation", "").strip()
        direction = attrs.get("CameraDirection", "").strip()
        snapshot_url = attrs.get("SnapShot", "").strip()
        age_str = attrs.get("AgeInMinutes", "")
        too_old = attrs.get("TooOld", "false") == "true"

        # Skip cameras with no snapshot or that are marked too old
        if not snapshot_url:
            continue

        obj_id = attrs.get("OBJECTID", len(cameras))

        cameras.append({
            "id": f"il-arcgis-{obj_id}",
            "name": name or f"IL Camera {obj_id}",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": "",
            "state": "Illinois",
            "stateCode": "IL",
            "source": "dot",
            "category": "traffic",
            "streamType": "image_refresh",
            "streamUrl": snapshot_url,
            "thumbnailUrl": snapshot_url,
            "isActive": not too_old,
            "attribution": "IDOT / Travel Midwest",
            "highway": "",
            "direction": direction,
        })

    output_file = f"{OUTPUT_DIR}/il_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    active = sum(1 for c in cameras if c["isActive"])
    print(f"\nTotal Illinois cameras: {len(cameras)} ({active} active)")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
