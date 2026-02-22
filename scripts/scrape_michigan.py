#!/usr/bin/env python3
"""
Scrape Michigan DOT MiDrive camera data.
API returns JSON with embedded HTML for images.
~757 cameras with thumbnail URLs.
"""

import urllib.request
import json
import re

OUTPUT_DIR = "scripts/output"

API_URL = "https://mdotjboss.state.mi.us/MiDrive/camera/list"


def main():
    print("Scraping Michigan DOT MiDrive cameras...")

    req = urllib.request.Request(API_URL, headers={
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    })

    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  Error fetching data: {e}")
        return

    print(f"  Raw records: {len(data)}")

    cameras = []
    for cam in data:
        # Extract image URL from embedded HTML
        image_html = cam.get("image", "")
        img_match = re.search(r'src="([^"]+)"', image_html)
        if not img_match:
            continue

        img_url = img_match.group(1)

        # Extract lat/lon from county HTML link
        county_html = cam.get("county", "")
        lat_match = re.search(r'lat=([\d.-]+)', county_html)
        lon_match = re.search(r'lon=([\d.-]+)', county_html)
        id_match = re.search(r'id=(\d+)', county_html)

        if not lat_match or not lon_match:
            continue

        lat = float(lat_match.group(1))
        lon = float(lon_match.group(1))
        cam_id = id_match.group(1) if id_match else str(len(cameras))

        if lat == 0 or lon == 0:
            continue

        # Clean county name
        county = re.sub(r'<[^>]+>', '', county_html).strip()

        route = cam.get("route", "").strip()
        location = cam.get("location", "").strip()
        direction = cam.get("direction", "").strip()

        name = f"{route} {location}".strip() if route else location
        if not name:
            name = f"MI Camera {cam_id}"

        # Extract city from location if possible
        city = county.replace(" County", "").strip() if county else ""

        cameras.append({
            "id": f"mi-midrive-{cam_id}",
            "name": name,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city,
            "state": "Michigan",
            "stateCode": "MI",
            "source": "dot",
            "category": "traffic",
            "streamType": "image_refresh",
            "streamUrl": img_url,
            "thumbnailUrl": img_url,
            "isActive": True,
            "attribution": "Michigan DOT MiDrive",
            "highway": route,
            "direction": direction,
        })

    output_file = f"{OUTPUT_DIR}/mi_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    print(f"\nTotal Michigan cameras: {len(cameras)}")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
