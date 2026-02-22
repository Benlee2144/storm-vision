#!/usr/bin/env python3
"""
Scrape Indiana DOT camera data from CastleRock Associates (CARS) API.
Used by 511in.org. No auth required. Returns ~735 cameras with HLS streams.
"""

import urllib.request
import json

OUTPUT_DIR = "scripts/output"

API_URL = "https://intg.carsprogram.org/cameras_v1/api/cameras"


def main():
    print("Scraping Indiana DOT cameras from CARS API...")

    req = urllib.request.Request(API_URL, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://511in.org",
        "Referer": "https://511in.org/",
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

        if lat == 0 or lon == 0:
            continue

        name = cam.get("name", "").strip()
        is_active = cam.get("active", True)
        route = loc.get("routeId", "")
        city_ref = loc.get("cityReference", "")
        cam_id = cam.get("id", len(cameras))

        # Get stream info from views
        views = cam.get("views", [])
        hls_url = ""
        thumbnail_url = ""

        for view in views:
            url = view.get("url", "")
            preview = view.get("videoPreviewUrl", "")
            if url and "m3u8" in url:
                hls_url = url
            if preview:
                thumbnail_url = preview

        # Determine stream type and primary URL
        stream_type = "image_refresh"
        primary_url = thumbnail_url
        if hls_url:
            stream_type = "hls"
            primary_url = hls_url

        if not primary_url and not thumbnail_url:
            continue

        cameras.append({
            "id": f"in-cars-{cam_id}",
            "name": name or f"IN Camera {cam_id}",
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city_ref.replace("near ", "").strip() if city_ref else "",
            "state": "Indiana",
            "stateCode": "IN",
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": primary_url,
            "thumbnailUrl": thumbnail_url,
            "isActive": is_active,
            "attribution": "INDOT TrafficWise",
            "highway": route,
            "direction": "",
        })

    output_file = f"{OUTPUT_DIR}/in_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    active = sum(1 for c in cameras if c["isActive"])
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"\nTotal Indiana cameras: {len(cameras)} ({active} active, {hls_count} with HLS)")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
