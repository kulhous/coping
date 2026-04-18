import argparse
import json
import time
from io import BytesIO
from pathlib import Path
from typing import Dict, Iterable, List
from urllib import error, request

from huggingface_hub import InferenceClient
from PIL import Image


CARDS_PATH = Path("web/data/kids_cards.json")
OUTPUT_DIR = Path("generated_icons/api")
QUIVER_OUTPUT_DIR = Path("generated_icons/quiver")
HF_MODEL = "black-forest-labs/FLUX.1-schnell"
QUIVER_MODEL = "arrow-preview"
MASTER_SIZE = 512
THUMB_SIZES = (120, 80)
QUIVER_RETRIES = 4
QUIVER_TIMEOUT_SECONDS = 90
PROMPT_SUFFIX = "Icon centered with wide empty white margin on all sides, nothing touching the edges."
CURATED_SVG_SLUGS = {
    "box_breath",
    "butterfly_hug",
    "shake_it_out",
    "self_hug",
    "color_my_mood",
    "brain_dump",
    "secret_letter",
    "mood_dj",
    "body_map",
    "stop_sign",
    "urge_surfing",
    "coping_kit",
    "5_senses",
    "sour_candy",
    "cold_splash",
    "my_playlist",
    "heavy_blanket",
}


def slugify(text: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in text.lower().replace("&", "and")).strip("_")


def load_cards() -> List[Dict[str, str]]:
    return json.loads(CARDS_PATH.read_text(encoding="utf-8"))


def build_slug(card: Dict[str, str]) -> str:
    nickname = card.get("nickname_en") or card.get("nickname") or card["id"]
    return slugify(nickname)


def missing_cards(cards: Iterable[Dict[str, str]]) -> List[Dict[str, str]]:
    return [card for card in cards if build_slug(card) not in CURATED_SVG_SLUGS]


def remove_white_background(image: Image.Image, threshold: int = 245) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = []
    for red, green, blue, alpha in rgba.getdata():
        if red >= threshold and green >= threshold and blue >= threshold:
            pixels.append((255, 255, 255, 0))
        else:
            pixels.append((red, green, blue, alpha))
    rgba.putdata(pixels)
    return rgba


def normalize_to_square(image: Image.Image, size: int) -> Image.Image:
    bbox = image.getbbox()
    if bbox:
        image = image.crop(bbox)

    width, height = image.size
    scale = min((size * 0.72) / max(width, 1), (size * 0.72) / max(height, 1))
    resized = image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    offset = ((size - resized.width) // 2, (size - resized.height) // 2)
    canvas.paste(resized, offset, resized)
    return canvas


def output_dir_for(card: Dict[str, str]) -> Path:
    return OUTPUT_DIR / f"{card['id']}_{build_slug(card)}"


def prompt_for(card: Dict[str, str]) -> str:
    return f"{card['image_prompt_en']} {PROMPT_SUFFIX}"


def save_png_variants(image: Image.Image, card: Dict[str, str], suffix: str) -> None:
    slug = f"{card['id']}_{build_slug(card)}"
    target_dir = output_dir_for(card)
    target_dir.mkdir(parents=True, exist_ok=True)

    raw_path = target_dir / f"{slug}_{suffix}_raw.png"
    image.save(raw_path)

    transparent = remove_white_background(image)
    master = normalize_to_square(transparent, MASTER_SIZE)
    master.save(target_dir / f"{slug}_{suffix}_master_512.png")

    for thumb_size in THUMB_SIZES:
        thumb = master.resize((thumb_size, thumb_size), Image.LANCZOS)
        thumb.save(target_dir / f"{slug}_{suffix}_{thumb_size}.png")


def generate_hf_fallbacks(cards: Iterable[Dict[str, str]], force: bool) -> None:
    client = InferenceClient()
    for card in cards:
        slug = f"{card['id']}_{build_slug(card)}"
        target_dir = output_dir_for(card)
        output_path = target_dir / f"{slug}_hf_master_512.png"
        if output_path.exists() and not force:
            print(f"skip hf {slug}")
            continue

        print(f"generate hf {slug}")
        image = client.text_to_image(prompt_for(card), model=HF_MODEL)
        save_png_variants(image, card, "hf")


def quiver_output_path_for(card: Dict[str, str]) -> Path:
    slug = f"{card['id']}_{build_slug(card)}"
    return QUIVER_OUTPUT_DIR / f"{slug}.svg"


def generate_quiver_svg(card: Dict[str, str], token: str) -> Path:
    QUIVER_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    slug = f"{card['id']}_{build_slug(card)}"
    print(f"generate quiver {slug}")
    request_body = {
        "model": QUIVER_MODEL,
        "stream": False,
        "prompt": prompt_for(card),
        "instructions": (
            "Create a clean, centered SVG icon with transparent or visually empty background, "
            "rounded hand-drawn linework, black plus at most one muted pastel accent, and no frame."
        ),
        "temperature": 0.4,
        "top_p": 0.95,
        "max_output_tokens": 8192,
    }
    req = request.Request(
        "https://api.quiver.ai/v1/svgs/generations",
        data=json.dumps(request_body).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    for attempt in range(1, QUIVER_RETRIES + 1):
        try:
            with request.urlopen(req, timeout=QUIVER_TIMEOUT_SECONDS) as response:
                payload = json.loads(response.read().decode("utf-8"))
            break
        except error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="replace")
            if exc.code >= 500 and attempt < QUIVER_RETRIES:
                delay = 2 ** (attempt - 1)
                print(f"retry quiver {slug} attempt {attempt} after http {exc.code}")
                time.sleep(delay)
                continue
            raise SystemExit(f"quiver http {exc.code} for {slug}: {body}") from exc
        except error.URLError as exc:
            if attempt < QUIVER_RETRIES:
                delay = 2 ** (attempt - 1)
                print(f"retry quiver {slug} attempt {attempt} after network error: {exc.reason}")
                time.sleep(delay)
                continue
            raise SystemExit(f"quiver network error for {slug}: {exc.reason}") from exc
        except TimeoutError as exc:
            if attempt < QUIVER_RETRIES:
                delay = 2 ** (attempt - 1)
                print(f"retry quiver {slug} attempt {attempt} after timeout")
                time.sleep(delay)
                continue
            raise SystemExit(f"quiver timeout for {slug}") from exc

    json_path = QUIVER_OUTPUT_DIR / f"{slug}.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    svg = payload["data"][0]["svg"]
    svg_path = QUIVER_OUTPUT_DIR / f"{slug}.svg"
    svg_path.write_text(svg, encoding="utf-8")
    print(f"generated quiver {slug}")
    return svg_path


def generate_quiver_svgs(cards: Iterable[Dict[str, str]], token: str, force: bool) -> None:
    failures = []
    for card in cards:
        svg_path = quiver_output_path_for(card)
        if svg_path.exists() and not force:
            print(f"skip quiver {svg_path.stem}")
            continue
        try:
            generate_quiver_svg(card, token)
        except SystemExit as exc:
            failures.append(str(exc))
            print(f"failed quiver {card['id']}: {exc}")

    if failures:
        raise SystemExit("\n".join(failures))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate hosted API fallback icons and Quiver SVGs.")
    parser.add_argument("--force", action="store_true", help="Regenerate existing fallback PNGs.")
    parser.add_argument("--skip-hf", action="store_true", help="Skip Hugging Face PNG fallback generation.")
    parser.add_argument(
        "--quiver-id",
        help="Card id to generate through Quiver. Requires --quiver-token.",
    )
    parser.add_argument(
        "--quiver-all",
        action="store_true",
        help="Generate Quiver SVGs for all cards in the missing-card set. Requires --quiver-token.",
    )
    parser.add_argument(
        "--quiver-token",
        help="Quiver bearer token. Prefer passing this via the command line at runtime, not storing it.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    cards = load_cards()
    pending = missing_cards(cards)
    print(f"missing cards: {len(pending)}")
    if not args.skip_hf:
        generate_hf_fallbacks(pending, force=args.force)

    if args.quiver_all or args.quiver_id:
        if not args.quiver_token:
            raise SystemExit("Quiver generation requires --quiver-token")

    if args.quiver_all:
        generate_quiver_svgs(pending, args.quiver_token, force=args.force)
    elif args.quiver_id:
        try:
            card = next(card for card in pending if card["id"] == args.quiver_id)
        except StopIteration as exc:
            raise SystemExit(f"card {args.quiver_id} is not in the missing-card set") from exc
        svg_path = quiver_output_path_for(card)
        if svg_path.exists() and not args.force:
            print(f"skip quiver {svg_path.stem}")
            return
        generate_quiver_svg(card, args.quiver_token)


if __name__ == "__main__":
    main()