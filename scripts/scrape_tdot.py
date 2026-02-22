#!/usr/bin/env python3
"""
Scrape Tennessee DOT SmartWay camera data from their public API.
API key is publicly embedded in the SmartWay Angular app config.
Returns ~666 cameras with HLS live streams.
"""

import urllib.request
import json

OUTPUT_DIR = "scripts/output"

API_URL = "https://www.tdot.tn.gov/opendata/api/public/RoadwayCameras"
API_KEY = "8d3b7a82635d476795c09b2c41facc60"


def main():
    print("Scraping Tennessee DOT SmartWay cameras...")

    req = urllib.request.Request(API_URL, headers={
        "ApiKey": API_KEY,
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
        lat = cam.get("lat")
        lng = cam.get("lng")

        if not lat or not lng:
            continue

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            continue

        if lat == 0 or lng == 0:
            continue

        title = cam.get("title", "").strip()
        is_active = str(cam.get("active", "true")).lower() == "true"
        jurisdiction = cam.get("jurisdiction", "")
        route = cam.get("route", "")
        thumbnail = cam.get("thumbnailUrl", "")
        hls_url = cam.get("httpsVideoUrl", "") or cam.get("httpVideoUrl", "")

        # Determine stream type
        stream_type = "image_refresh"
        primary_url = thumbnail
        if hls_url and "m3u8" in hls_url:
            stream_type = "hls"
            primary_url = hls_url

        cameras.append({
            "id": f"tn-smartway-{cam.get('id', len(cameras))}",
            "name": title or f"TN Camera {cam.get('id', '')}",
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "city": jurisdiction,
            "state": "Tennessee",
            "stateCode": "TN",
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": primary_url,
            "thumbnailUrl": thumbnail,
            "isActive": is_active,
            "attribution": "TDOT SmartWay",
            "highway": route,
            "direction": "",
        })

    output_file = f"{OUTPUT_DIR}/tn_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    active = sum(1 for c in cameras if c["isActive"])
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"\nTotal Tennessee cameras: {len(cameras)} ({active} active, {hls_count} with HLS streams)")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
