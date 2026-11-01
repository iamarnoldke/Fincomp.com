# Weekly job (run by GitHub Actions). It asks the Fincomp API to import every
# Bank of Uganda rates PDF listed in scripts/bou_pdfs.txt, plus any it finds on
# the page in BOU_LISTING_URL (optional; the BoU pages build their lists with
# JavaScript, so this usually finds nothing). Importing an edition that is
# already stored just replaces it with the same figures, so weekly runs are safe.
# Environment: API_URL, CRON_SECRET, and optionally BOU_LISTING_URL

import json
import os
import re
import sys
import urllib.parse
import urllib.request

LISTING = os.environ.get("BOU_LISTING_URL", "")
LIST_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bou_pdfs.txt")
API = os.environ["API_URL"].rstrip("/")
SECRET = os.environ["CRON_SECRET"]

def get(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Fincomp-weekly-job"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")

def find_pdfs() -> list[str]:
    urls = set()
    with open(LIST_FILE) as f:
        urls |= {ln.strip() for ln in f if ln.strip() and not ln.startswith("#")}
    if LISTING:
        try:
            html = get(LISTING)
            hrefs = re.findall(r'href=["\']([^"\']+\.pdf)["\']', html, re.I)
            urls |= {urllib.parse.urljoin(LISTING, h) for h in hrefs
                     if re.search(r"interest[_\- ]*rates.*charges", urllib.parse.unquote(h), re.I)}
        except Exception as exc:  # noqa: BLE001
            print("Could not read the listing page (continuing with the file):", exc)
    return sorted(urls)

def main() -> int:
    pdfs = find_pdfs()
    if not pdfs:
        print("No PDF addresses to import. Add some to scripts/bou_pdfs.txt.")
        return 1
    failed = 0
    for url in pdfs:
        req = urllib.request.Request(
            f"{API}/internal/bou-refresh", method="POST",
            data=json.dumps({"pdf_url": url}).encode(),
            headers={"Content-Type": "application/json", "X-Cron-Secret": SECRET})
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                print("OK", url, r.read().decode())
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print("FAILED", url, exc, getattr(exc, "read", lambda: b"")().decode("utf-8", "replace"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())