import json
import re
import zlib
from pathlib import Path
from typing import Dict, List

import torch
from diffusers import FluxPipeline
from PIL import Image


# FLUX.1-schnell — Apache-licensed, no gating required.
# To use FLUX.1-dev instead (better quality), accept the license at
# https://huggingface.co/black-forest-labs/FLUX.1-dev then change MODEL_ID below.
MODEL_ID = "black-forest-labs/FLUX.1-schnell"
OUTPUT_DIR = Path("generated_icons")
CARDS_PATH = Path("web/data/kids_cards.json")
# FLUX performs best at multiples of 64; 768 is a good icon generation size
CANVAS_SIZE = 768
MASTER_SIZE = 512
THUMB_SIZES = (120, 80)
DEVICE = "mps" if torch.backends.mps.is_available() else "cpu"

PROMPT_SUFFIX = "Icon centered with wide empty white margin on all sides, nothing touching the edges."

# FLUX does not use a negative prompt — guidance is handled by its guidance_scale
NEGATIVE_PROMPT = None


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")
    return slug or "card"


def build_seed(card_id: str) -> int:
    return (zlib.crc32(card_id.encode("utf-8")) % 100000) + 1


def load_prompts() -> List[Dict[str, object]]:
    cards = json.loads(CARDS_PATH.read_text(encoding="utf-8"))
    prompts = []
    for card in cards:
        if not card.get("image_prompt_en"):
            continue
        nickname = card.get("nickname_en") or card.get("nickname") or card["id"]
        slug = f"{card['id']}_{slugify(nickname)}"
        prompts.append(
            {
                "id": card["id"],
                "slug": slug,
                "seed": build_seed(card["id"]),
                "prompt": f"{card['image_prompt_en']} {PROMPT_SUFFIX}",
            }
        )
    return prompts


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


def build_pipeline() -> FluxPipeline:
    # FLUX.1-schnell: load in bfloat16 (MPS supports it), then move to device.
    # Cast text encoders to float32 on MPS to avoid NaN in T5 attention.
    from huggingface_hub import HfFolder
    token = HfFolder.get_token()
    pipe = FluxPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
        token=token,
    )
    pipe.enable_attention_slicing()
    pipe.set_progress_bar_config(disable=False)
    pipe.to(DEVICE)
    if DEVICE == "mps":
        pipe.text_encoder.to(dtype=torch.float32)
        pipe.text_encoder_2.to(dtype=torch.float32)
    return pipe


def main() -> None:
    OUTPUT_DIR.mkdir(exist_ok=True)

    pipe = build_pipeline()
    prompts = load_prompts()

    for item in prompts:
        slug = item["slug"]
        slug_dir = OUTPUT_DIR / slug
        slug_dir.mkdir(exist_ok=True)

        generator = torch.Generator(device="cpu").manual_seed(item["seed"])
        result = pipe(
            prompt=item["prompt"],
            width=CANVAS_SIZE,
            height=CANVAS_SIZE,
            guidance_scale=0.0,       # schnell is distilled — no CFG; dev: use 3.5
            num_inference_steps=4,    # schnell: 4 steps; dev: 28
            generator=generator,
        )

        image = result.images[0]
        image.save(slug_dir / f"{slug}_raw.png")

        transparent = remove_white_background(image)
        master = normalize_to_square(transparent, MASTER_SIZE)
        master.save(slug_dir / f"{slug}_master_512.png")

        for thumb_size in THUMB_SIZES:
            thumb = master.resize((thumb_size, thumb_size), Image.LANCZOS)
            thumb.save(slug_dir / f"{slug}_{thumb_size}.png")

        print(f"saved {slug_dir}")


if __name__ == "__main__":
    main()