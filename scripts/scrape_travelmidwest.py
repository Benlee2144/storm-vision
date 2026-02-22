#!/usr/bin/env python3
"""
Scrape Illinois DOT cameras from TravelMidwest GeoJSON API.
Endpoint: https://travelmidwest.com/lmiga/cameras.json
"""

import urllib.request
import json

OUTPUT_DIR = "scripts/output"


def main():
    print("Scraping Illinois cameras from TravelMidwest...")

    url = "https://travelmidwest.com/lmiga/cameras.json"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })

    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read().decode())
    features = data.get("features", [])
    print(f"  Total features: {len(features)}")

    cameras = []
    for f in features:
        props = f.get("properties", {})
        coords = f.get("geometry", {}).get("coordinates", [])
        if len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]
        cam_id = props.get("id", "")
        description = props.get("description", "")
        on_road = props.get("onRoad", "")
        city = props.get("city", "")
        county = props.get("county", "")
        state = props.get("state", "Illinois")

        # Get the best image URL
        urls = props.get("urls", [])
        stream_url = ""
        thumbnail_url = ""
        if urls:
            stream_url = urls[0].get("url", "")
            thumbnail_url = urls[0].get("thumbnail", "")

        name = description or f"{on_road} at {county}"

        cameras.append({
            "id": f"il-idot-{cam_id.lower().replace(' ', '-')}",
            "name": name,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city,
            "state": "Illinois",
            "stateCode": "IL",
            "source": "dot",
            "category": "traffic",
            "streamType": "image_refresh",
            "streamUrl": stream_url,
            "thumbnailUrl": thumbnail_url,
            "isActive": True,
            "attribution": "IDOT / TravelMidwest",
            "highway": on_road,
            "direction": urls[0].get("direction", "") if urls else "",
        })

    output_file = f"{OUTPUT_DIR}/il_cameras.json"
    with open(output_file, "w") as f_out:
        json.dump(cameras, f_out, indent=2)
    print(f"  DONE: {len(cameras)} cameras saved to {output_file}")


if __name__ == "__main__":
    main()
