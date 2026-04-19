import argparse
import subprocess
from pathlib import Path

import torch


MODEL_ID = "NucleusAI/Nucleus-Image"
DEFAULT_PROMPT = (
    "Hand-drawn line art icon of two cupped hands catching cool water droplets, "
    "transparent background, rounded organic brush-pen strokes, one muted pale blue accent, "
    "centered composition with wide empty margin, calm and grounding"
)


def get_total_memory_gb() -> float:
    try:
        mem_bytes = int(subprocess.check_output(["sysctl", "-n", "hw.memsize"]).decode().strip())
        return mem_bytes / (1024**3)
    except Exception:
        return 0.0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Try NucleusAI/Nucleus-Image on a CUDA machine.")
    parser.add_argument("--prompt", default=DEFAULT_PROMPT)
    parser.add_argument("--output", default="generated_icons/nucleus_test.png")
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--steps", type=int, default=50)
    parser.add_argument("--guidance", type=float, default=8.0)
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def ensure_supported_environment() -> None:
    total_memory_gb = get_total_memory_gb()
    if not torch.cuda.is_available():
        device_label = "mps" if torch.backends.mps.is_available() else "cpu"
        raise SystemExit(
            "Nucleus-Image is not practical in this environment. "
            f"Detected device: {device_label}. Total system memory: {total_memory_gb:.1f} GB. "
            "The published model weights are roughly 49 GB before runtime overhead, and the model card "
            "documents CUDA usage. Run this script on a Linux/Windows machine with a recent NVIDIA GPU instead."
        )


def build_pipeline():
    try:
        from diffusers import DiffusionPipeline, TextKVCacheConfig
    except ImportError as exc:
        raise SystemExit(
            "This script needs a newer diffusers build with TextKVCacheConfig. "
            "Install it with: pip install git+https://github.com/huggingface/diffusers"
        ) from exc

    pipe = DiffusionPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16)
    pipe.to("cuda")
    pipe.transformer.enable_cache(TextKVCacheConfig())
    pipe.set_progress_bar_config(disable=False)
    return pipe


def main() -> None:
    args = parse_args()
    ensure_supported_environment()

    pipe = build_pipeline()
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    image = pipe(
        prompt=args.prompt,
        width=args.width,
        height=args.height,
        num_inference_steps=args.steps,
        guidance_scale=args.guidance,
        generator=torch.Generator(device="cuda").manual_seed(args.seed),
    ).images[0]
    image.save(output_path)
    print(f"saved {output_path}")


if __name__ == "__main__":
    main()