#!/usr/bin/env python3
"""Scrape cameras from Michigan DOT's MiDrive system."""
import json
import urllib.request
import ssl
import re
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def main():
    url = "https://mdotjboss.state.mi.us/MiDrive/camera/list"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    })

    print("Fetching Michigan camera list...")
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    data = json.loads(resp.read().decode("utf-8"))

    print(f"  Found {len(data)} camera records")

    cameras = []
    for cam in data:
        # Parse lat/lon from county field HTML
        county_html = cam.get("county", "")
        lat = None
        lon = None

        # Extract coordinates from the HTML link (format: lat=42.491304&lon=-83.04479)
        lat_match = re.search(r'lat=([-\d.]+)', county_html)
        lon_match = re.search(r'lon=([-\d.]+)', county_html)
        if lat_match and lon_match:
            lat = float(lat_match.group(1))
            lon = float(lon_match.group(1))

        if not lat or not lon:
            # Try other coordinate patterns
            coord_match = re.search(r'([-\d.]+),\s*([-\d.]+)', county_html)
            if coord_match:
                lat = float(coord_match.group(1))
                lon = float(coord_match.group(2))

        if not lat or not lon:
            continue

        # Extract county name from HTML
        county_name = re.sub(r'<[^>]+>', '', county_html).strip()

        # Parse image URL from image field HTML
        image_html = cam.get("image", "")
        img_match = re.search(r'src=["\']([^"\']+)["\']', image_html)
        image_url = img_match.group(1) if img_match else ""

        if image_url and not image_url.startswith("http"):
            image_url = f"https://mdotjboss.state.mi.us{image_url}"

        # Build name from route, location, direction
        route = cam.get("route", "").strip()
        location = cam.get("location", "").strip()
        direction = cam.get("direction", "").strip()

        name = location or f"{route} {direction}".strip()
        if not name:
            name = f"MI Camera {len(cameras)}"

        # Extract actual ID from county HTML or image HTML
        id_match = re.search(r'id=(\d+)', county_html)
        cam_id = f"mi-mdot-{id_match.group(1)}" if id_match else f"mi-mdot-{len(cameras)}"

        cameras.append({
            "id": cam_id,
            "name": name,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": county_name,
            "state": "Michigan",
            "stateCode": "MI",
            "source": "dot",
            "category": "traffic",
            "streamType": "image_refresh",
            "streamUrl": image_url,
            "thumbnailUrl": image_url,
            "isActive": True,
            "attribution": "Michigan DOT / MiDrive",
            "highway": route,
            "direction": direction,
        })

    print(f"  Extracted {len(cameras)} cameras with coordinates")

    output_file = os.path.join(OUTPUT_DIR, "mi_cameras.json")
    with open(output_file, "w") as f:
        json.dump(cameras, f, indent=2)
    print(f"  Saved to {output_file}")


if __name__ == "__main__":
    main()
