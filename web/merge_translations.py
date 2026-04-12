"""Build web/data/methods_bilingual.json from _methods_en.json + czech_data.CS_BY_ID."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from czech_data import CS_BY_ID  # noqa: E402

def main() -> None:
    with open(ROOT / "_methods_en.json", encoding="utf-8") as f:
        rows = json.load(f)
    out = []
    for row in rows:
        rid = row["ID"]
        cs = CS_BY_ID.get(rid)
        if cs is None:
            print(f"  WARN: no Czech for {rid}, using EN as fallback")
            cs = dict(row)
        out.append({"id": rid, "en": row, "cs": cs})
    dest = Path(__file__).resolve().parent / "data" / "methods_bilingual.json"
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(out)} records to {dest}")


if __name__ == "__main__":
    main()
