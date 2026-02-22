#!/usr/bin/env python3
"""
Scrape Caltrans (California DOT) camera data from their public JSON feeds.
Each district has a separate endpoint at cwwp2.dot.ca.gov.
Data format: nested JSON with cctv objects containing location, image, and stream URLs.
"""

import urllib.request
import json
import ssl
import re
import time

OUTPUT_DIR = "scripts/output"

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

DISTRICTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]


def scrape_district(district):
    """Scrape cameras for a single Caltrans district."""
    url = f"https://cwwp2.dot.ca.gov/data/d{district}/cctv/cctvStatusD{district:02d}.json"

    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
    })

    try:
        resp = urllib.request.urlopen(req, timeout=60, context=ctx)
        raw = resp.read().decode('utf-8', errors='replace')

        # Fix common JSON issues in Caltrans data
        raw = re.sub(r',\s*([}\]])', r'\1', raw)

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Try fixing more aggressively
            raw = raw.rstrip().rstrip(',').rstrip()
            if not raw.endswith('}'):
                # Find last complete object
                last_brace = raw.rfind('}')
                if last_brace > 0:
                    raw = raw[:last_brace+1]
                    # Count brackets to balance
                    opens = raw.count('{') + raw.count('[')
                    closes = raw.count('}') + raw.count(']')
                    raw += ']' * (opens - closes)  # Simple fix
            data = json.loads(raw)

        return data
    except Exception as e:
        print(f"  District {district} error: {e}")
        return None


def process_caltrans_data(data, district):
    """Convert Caltrans data format to our standard format."""
    cameras = []

    if not data:
        return cameras

    items = data.get('data', []) if isinstance(data, dict) else data

    for i, item in enumerate(items):
        cctv = item.get('cctv', item)
        loc = cctv.get('location', {})

        lat = loc.get('latitude')
        lon = loc.get('longitude')

        if not lat or not lon:
            continue

        try:
            lat = float(str(lat).strip('"'))
            lon = float(str(lon).strip('"'))
        except (ValueError, TypeError):
            continue

        if lat == 0 or lon == 0:
            continue

        location_name = loc.get('locationName', '')
        nearby = loc.get('nearbyPlace', '')
        route = loc.get('route', '')
        county = loc.get('county', '')
        direction = loc.get('direction', '')
        in_service = cctv.get('inService', 'true') == 'true'

        image_data = cctv.get('imageData', {})
        stream_url = image_data.get('streamingVideoURL', '')
        static = image_data.get('static', {})
        image_url = static.get('currentImageURL', '')

        name = location_name or f"{route} near {nearby}" if nearby else f"D{district} Camera {i}"
        city = nearby if nearby else ''

        # Determine stream type
        stream_type = 'image_refresh'
        primary_url = image_url
        if stream_url and ('m3u8' in stream_url or 'stream' in stream_url):
            stream_type = 'hls'
            primary_url = stream_url

        cameras.append({
            "id": f"ca-d{district}-{i}",
            "name": name,
            "latitude": round(lat, 6),
            "longitude": round(lon, 6),
            "city": city,
            "state": "California",
            "stateCode": "CA",
            "source": "dot",
            "category": "traffic",
            "streamType": stream_type,
            "streamUrl": primary_url,
            "thumbnailUrl": image_url,
            "isActive": in_service,
            "attribution": f"Caltrans District {district}",
            "highway": route,
            "direction": direction,
        })

    return cameras


def main():
    all_cameras = []

    for district in DISTRICTS:
        print(f"Scraping Caltrans District {district}...")
        data = scrape_district(district)
        cameras = process_caltrans_data(data, district)
        print(f"  District {district}: {len(cameras)} cameras")
        all_cameras.extend(cameras)
        time.sleep(0.3)

    output_file = f"{OUTPUT_DIR}/ca_cameras.json"
    with open(output_file, 'w') as f:
        json.dump(all_cameras, f, indent=2)
    print(f"\nTotal California cameras: {len(all_cameras)}")
    print(f"Saved to {output_file}")


if __name__ == "__main__":
    main()
