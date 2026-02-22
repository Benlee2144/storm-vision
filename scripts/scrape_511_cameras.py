#!/usr/bin/env python3
"""
Scrape traffic cameras from state 511 systems that use the standard
POST /List/GetData/Cameras endpoint (FL, GA, NY, PA, AZ, WI, LA).

Each returns paginated JSON with camera data including lat/lon, stream URLs,
and image URLs.
"""

import urllib.request
import json
import ssl
import sys
import time
import re

OUTPUT_DIR = "scripts/output"

# SSL context that doesn't verify (some state sites have cert issues)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# States with working 511 POST endpoints
STATES_511 = [
    {
        "code": "FL",
        "name": "Florida",
        "url": "https://fl511.com/List/GetData/Cameras",
        "referer": "https://fl511.com/",
        "image_base": "https://fl511.com",
        "attribution": "FDOT / FL511",
    },
    {
        "code": "GA",
        "name": "Georgia",
        "url": "https://511ga.org/List/GetData/Cameras",
        "referer": "https://511ga.org/",
        "image_base": "https://511ga.org",
        "attribution": "GDOT / 511GA",
    },
    {
        "code": "NY",
        "name": "New York",
        "url": "https://511ny.org/List/GetData/Cameras",
        "referer": "https://511ny.org/",
        "image_base": "https://511ny.org",
        "attribution": "NYSDOT / 511NY",
    },
    {
        "code": "PA",
        "name": "Pennsylvania",
        "url": "https://511pa.com/List/GetData/Cameras",
        "referer": "https://511pa.com/",
        "image_base": "https://511pa.com",
        "attribution": "PennDOT / 511PA",
    },
    {
        "code": "AZ",
        "name": "Arizona",
        "url": "https://az511.com/List/GetData/Cameras",
        "referer": "https://az511.com/",
        "image_base": "https://az511.com",
        "attribution": "ADOT / AZ511",
    },
    {
        "code": "WI",
        "name": "Wisconsin",
        "url": "https://511wi.gov/List/GetData/Cameras",
        "referer": "https://511wi.gov/",
        "image_base": "https://511wi.gov",
        "attribution": "WisDOT / 511WI",
    },
    {
        "code": "LA",
        "name": "Louisiana",
        "url": "https://www.511la.org/List/GetData/Cameras",
        "referer": "https://www.511la.org/",
        "image_base": "https://www.511la.org",
        "attribution": "LADOTD / 511LA",
    },
]


def parse_latlng(latlng_obj):
    """Extract lat/lng from the 511 wellKnownText format."""
    if not latlng_obj:
        return None, None
    geo = latlng_obj.get("geography", {})
    wkt = geo.get("wellKnownText", "")
    # Format: "POINT (-80.892882 26.17325)"
    m = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", wkt)
    if m:
        lon = float(m.group(1))
        lat = float(m.group(2))
        return lat, lon
    return None, None


def get_stream_info(images, image_base):
    """Extract the best stream URL and thumbnail from camera images."""
    if not images:
        return "image_refresh", "", ""

    img = images[0]
    video_url = img.get("videoUrl", "")
    image_url = img.get("imageUrl", "")
    video_type = img.get("videoType", "")

    # Build full image URL
    if image_url and not image_url.startswith("http"):
        image_url = image_base + image_url

    # Determine stream type
    if video_url and "m3u8" in video_url:
        return "hls", video_url, image_url
    elif video_url and not img.get("isVideoAuthRequired", False):
        return "hls", video_url, image_url
    else:
        return "image_refresh", image_url, image_url


def scrape_511_state(state_config, page_size=100):
    """Scrape all cameras from a 511 state endpoint with pagination."""
    cameras = []
    start = 0
    total = None

    while True:
        body = f"draw=1&columns%5B0%5D%5Bdata%5D=cameras&start={start}&length={page_size}"

        req = urllib.request.Request(
            state_config["url"],
            data=body.encode(),
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": state_config["referer"],
            },
        )

        try:
            resp = urllib.request.urlopen(req, timeout=30, context=ctx)
            data = json.loads(resp.read().decode())
        except Exception as e:
            print(f"  Error at offset {start}: {e}")
            break

        batch = data.get("data", [])
        if total is None:
            total = data.get("recordsTotal", 0)
            print(f"  Total cameras reported: {total}")

        if not batch:
            break

        for cam in batch:
            lat, lon = parse_latlng(cam.get("latLng"))
            if lat is None or lon is None:
                continue

            stream_type, stream_url, thumbnail_url = get_stream_info(
                cam.get("images", []), state_config["image_base"]
            )

            # Build location description
            roadway = cam.get("roadway", "")
            direction = cam.get("direction", "")
            location = cam.get("location", "")
            name = location or f"{roadway} {direction}".strip()

            # Clean up name
            name = name.replace("_", " ").strip()
            if not name:
                name = f"Camera {cam.get('id', start)}"

            camera_id = f"{state_config['code'].lower()}-511-{cam.get('id', start)}"

            cameras.append({
                "id": camera_id,
                "name": name,
                "latitude": round(lat, 6),
                "longitude": round(lon, 6),
                "city": "",  # 511 doesn't always provide city
                "state": state_config["name"],
                "stateCode": state_config["code"],
                "source": "dot",
                "category": "traffic",
                "streamType": stream_type,
                "streamUrl": stream_url,
                "thumbnailUrl": thumbnail_url,
                "isActive": True,
                "attribution": state_config["attribution"],
                "highway": roadway,
                "direction": direction,
            })

        start += page_size
        print(f"  Scraped {len(cameras)} / {total} cameras...")

        if start >= total:
            break

        time.sleep(0.5)  # Be nice to the servers

    return cameras


def main():
    all_cameras = []
    state_filter = sys.argv[1].upper() if len(sys.argv) > 1 else None

    for state in STATES_511:
        if state_filter and state["code"] != state_filter:
            continue

        print(f"\n{'='*60}")
        print(f"Scraping {state['name']} ({state['code']})...")
        print(f"  URL: {state['url']}")

        cameras = scrape_511_state(state)
        print(f"  DONE: {len(cameras)} cameras scraped")

        # Save per-state file
        output_file = f"{OUTPUT_DIR}/{state['code'].lower()}_cameras.json"
        with open(output_file, "w") as f:
            json.dump(cameras, f, indent=2)
        print(f"  Saved to {output_file}")

        all_cameras.extend(cameras)

    if not state_filter:
        # Save combined file
        output_file = f"{OUTPUT_DIR}/all_511_cameras.json"
        with open(output_file, "w") as f:
            json.dump(all_cameras, f)
        print(f"\n{'='*60}")
        print(f"TOTAL: {len(all_cameras)} cameras from {len(STATES_511)} states")
        print(f"Saved combined to {output_file}")


if __name__ == "__main__":
    main()
