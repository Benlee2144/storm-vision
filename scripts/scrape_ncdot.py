#!/usr/bin/env python3
"""
Scrape North Carolina DOT camera data from NCDOT Traffic API.
No auth required. List endpoint returns IDs + coords, then
batch fetch details for image URLs.
"""

import urllib.request
import json
import time

OUTPUT_DIR = "scripts/output"

LIST_URL = "https://eapps.ncdot.gov/services/traffic-prod/v1/cameras"
DETAIL_URL = "https://eapps.ncdot.gov/services/traffic-prod/v1/cameras/{id}"


def main():
    print("Scraping North Carolina DOT cameras...")

    req = urllib.request.Request(LIST_URL, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        camera_list = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  Error fetching list: {e}")
        return

    print(f"  Camera list: {len(camera_list)} cameras")

    cameras = []
    errors = 0

    for i, cam in enumerate(camera_list):
        cam_id = cam.get("id")
        lat = cam.get("latitude")
        lon = cam.get("longitude")

        if not cam_id or not lat or not lon:
            continue

        try:
            lat = float(lat)
            lon = float(lon)
        except (ValueError, TypeError):
            continue

        if lat == 0 or lon == 0:
            continue

        detail_url = DETAIL_URL.format(id=cam_id)
        try:
            req2 = urllib.request.Request(detail_url, headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
            })
            resp2 = urllib.request.urlopen(req2, timeout=10)
            detail = json.loads(resp2.read().decode("utf-8"))
        except Exception:
            errors += 1
            continue

        location_name = detail.get("locationName", "")
        image_url = detail.get("imageURL", "")
        status = detail.get("status", "OK")

        if not image_url:
            continue

        cameras.append({
            "id": f"nc-ncdot-{cam_id}",
            "name": location_name.replace("_", " ").strip() if location_name else f"NC Camera {cam_id}",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": "",
            "state": "North Carolina",
            "stateCode": "NC",
            "source": "dot",
            "category": "traffic",
            "streamType": "image_refresh",
            "streamUrl": image_url,
            "thumbnailUrl": image_url,
            "isActive": status == "OK",
            "attribution": "NCDOT",
            "highway": "",
            "direction": "",
        })

        if (i + 1) % 100 == 0:
            print(f"    Processed {i + 1}/{len(camera_list)} ({len(cameras)} with images, {errors} errors)")
            time.sleep(0.05)

    output_file = f"{OUTPUT_DIR}/nc_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    active = sum(1 for c in cameras if c["isActive"])
    print(f"\nTotal North Carolina cameras: {len(cameras)} ({active} active)")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
