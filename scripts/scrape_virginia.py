#!/usr/bin/env python3
"""
Scrape Virginia DOT camera data from 511 VDOT GeoJSON feed.
No auth required. Returns cameras with HLS live streams.
"""

import urllib.request
import json

OUTPUT_DIR = "scripts/output"

ACTIVE_URL = "https://data.511-atis-ttrip-prod.iteriscloud.com/datasets/cameras/icons.cameras.geojson"
INACTIVE_URL = "https://data.511-atis-ttrip-prod.iteriscloud.com/datasets/cameras/icons.cameras_inactive.geojson"


def fetch_geojson(url, label):
    """Fetch GeoJSON camera feed."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read().decode("utf-8"))
        features = data.get("features", [])
        print(f"  {label}: {len(features)} features")
        return features
    except Exception as e:
        print(f"  Error fetching {label}: {e}")
        return []


def main():
    print("Scraping Virginia DOT cameras...")

    active_features = fetch_geojson(ACTIVE_URL, "Active")
    inactive_features = fetch_geojson(INACTIVE_URL, "Inactive")

    all_features = active_features + inactive_features
    print(f"  Total raw features: {len(all_features)}")

    cameras = []
    seen_ids = set()

    for feat in all_features:
        props = feat.get("properties", {})
        geom = feat.get("geometry", {})
        coords = geom.get("coordinates", [])

        if len(coords) < 2:
            continue

        try:
            lon = float(coords[0])
            lat = float(coords[1])
        except (ValueError, TypeError):
            continue

        if lat == 0 or lon == 0:
            continue

        cam_id = props.get("id", "")
        if cam_id in seen_ids:
            continue
        seen_ids.add(cam_id)

        name = props.get("description", "").strip()
        cam_name = props.get("name", "")
        route = props.get("route", "")
        direction = props.get("direction", "")
        jurisdiction = props.get("jurisdiction", "")
        is_active = props.get("active", True)

        thumbnail = props.get("image_url", "")
        hls_url = props.get("https_url", "") or props.get("ios_url", "")

        stream_type = "image_refresh"
        primary_url = thumbnail
        if hls_url and "m3u8" in hls_url:
            stream_type = "hls"
            primary_url = hls_url

        if not primary_url and not thumbnail:
            continue

        cameras.append({
            "id": f"va-vdot-{cam_id}",
            "name": name or f"VA {route} {direction}".strip(),
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": jurisdiction,
            "state": "Virginia",
            "stateCode": "VA",
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": primary_url,
            "thumbnailUrl": thumbnail,
            "isActive": is_active,
            "attribution": "VDOT 511",
            "highway": route,
            "direction": direction,
        })

    output_file = f"{OUTPUT_DIR}/va_cameras.json"
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)

    active = sum(1 for c in cameras if c["isActive"])
    hls_count = sum(1 for c in cameras if c["streamType"] == "hls")
    print(f"\nTotal Virginia cameras: {len(cameras)} ({active} active, {hls_count} with HLS)")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
