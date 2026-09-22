from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import subprocess
import zipfile

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RELEASE = ROOT / "release"
OUTPUT = ROOT / os.environ.get("BERRIES_RELEASE_NAME", "berries_yandex_v6.zip")
MANIFEST = ROOT / "berries_build_manifest.json"

RUNTIME_FILES = [
    "index.html",
    "styles.css",
    "assets/map-digits.css",
    "vendor/phaser.min.js",
    "vendor/PHASER_LICENSE.md",
    "src/lifecycle.js",
    "src/campaign.js",
    "src/vertical_slice.js",
    "src/runtime_stable_v10.js",
    "src/sdk/yandex.js",
]

ASSET_FILES = [
    "assets/backgrounds/background_game_forest.jpg",
    "assets/backgrounds/background_title_forest.jpg",
    "assets/map/map_forest_background.jpg",
    "assets/map/map_header_levels.png",
    "assets/berries/berry_blackberry.png",
    "assets/berries/berry_blueberry.png",
    "assets/berries/berry_cloudberry.png",
    "assets/berries/berry_gooseberry.png",
    "assets/berries/berry_raspberry.png",
    "assets/berries/berry_strawberry.png",
    "assets/blockers/blocker_ice_1.png",
    "assets/blockers/blocker_ice_2.png",
    "assets/blockers/blocker_roots.png",
    "assets/blockers/goal_acorn.png",
    "assets/boosters/booster_fan.png",
    "assets/boosters/booster_hammer.png",
    "assets/boosters/booster_shuffle.png",
    "assets/characters/king/king_celebrate.png",
    "assets/characters/king/king_idle.png",
    "assets/characters/king/king_point.png",
    "assets/characters/king/king_sad.png",
    "assets/specials/special_bomb.png",
    "assets/specials/special_line_h.png",
    "assets/specials/special_line_v.png",
    "assets/specials/special_rainbow.png",
    "assets/ui/buttons/button_wood.png",
    "assets/ui/buttons/button_royal_family_soon.png",
    "assets/ui/decor/hero_stump_forest.png",
    "assets/ui/buttons/level_completed5.png",
    "assets/ui/buttons/level_completed7.png",
    "assets/ui/buttons/level_current7.png",
    "assets/ui/icons/ui_back.png",
    "assets/ui/icons/ui_coin.png",
    "assets/ui/icons/ui_settings.png",
    "assets/ui/panels/logo_main.png",
    "assets/ui/panels/panel22.png",
    "assets/ui/panels/panel23.png",
    "assets/ui/panels/panel_3.png",
    "assets/ui/panels/panel_boosters.png",
    "assets/ui/panels/panel_coins.png",
    "assets/ui/panels/panel_goals.png",
    "assets/ui/panels/panel_head_boosters.png",
    "assets/ui/panels/panel_king_shop.png",
    "assets/ui/panels/panel_level.png",
    "assets/ui/panels/panel_level_title.png",
    "assets/ui/panels/panel_lives.png",
    "assets/ui/panels/panel_time.png",
    "assets/ui/panels/popup33.png",
    "assets/ui/popups/popup_level_lose.png",
    "assets/ui/popups/popup_level_win.png",
    "assets/ui/popups/popup_shop_main.png",
]

AUDIO_COPY = [
    "audio/music/accents/combo.mp3",
    "audio/music/accents/victory.mp3",
    "audio/sfx/berry_pop_soft.mp3",
    "audio/sfx/ice_break.mp3",
    "audio/sfx/special_create_clear_bell.mp3",
    "audio/sfx/special_horizontal_sparkle_whoosh.mp3",
    "audio/sfx/special_vertical_sparkle.mp3",
    "audio/sfx/special_rainbow_magic_spell.mp3",
    "audio/sfx/combo_glitter_chime.mp3",
    "audio/sfx/acorn_superfast_crunch_source.mp3",
    "audio/sfx/vines_break_falling_tree.mp3",
]

# Conservative production dimensions: roughly 1.5-2x the largest in-game display size.
PNG_MAX = {
    "assets/map/map_header_levels.png": (1120, 350),
    "assets/ui/buttons/button_wood.png": (864, 300),
    "assets/ui/buttons/button_royal_family_soon.png": (420, 294),
    "assets/ui/decor/hero_stump_forest.png": (420, 294),
    "assets/ui/panels/logo_main.png": (1024, 700),
    "assets/ui/panels/panel22.png": (512, 970),
    "assets/ui/panels/panel23.png": (900, 223),
    "assets/ui/panels/panel_3.png": (940, 300),
    "assets/ui/panels/panel_boosters.png": (512, 1024),
    "assets/ui/panels/panel_coins.png": (800, 240),
    "assets/ui/panels/panel_goals.png": (512, 1149),
    "assets/ui/panels/panel_head_boosters.png": (760, 220),
    "assets/ui/panels/panel_king_shop.png": (1040, 350),
    "assets/ui/panels/panel_level.png": (940, 320),
    "assets/ui/panels/panel_level_title.png": (1024, 300),
    "assets/ui/panels/panel_lives.png": (840, 280),
    "assets/ui/panels/panel_time.png": (780, 320),
    "assets/ui/panels/popup33.png": (1086, 1448),
    "assets/ui/popups/popup_level_lose.png": (1024, 1280),
    "assets/ui/popups/popup_level_win.png": (1024, 1280),
    "assets/ui/popups/popup_shop_main.png": (1024, 1280),
}

def run(*args):
    subprocess.run(args, check=True)

def copy_one(rel):
    src = ROOT / rel
    if not src.is_file():
        raise FileNotFoundError(rel)
    dst = RELEASE / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def target_for(rel, size):
    if rel.startswith(("assets/berries/", "assets/blockers/", "assets/boosters/", "assets/specials/")):
        return (256, 256)
    if rel.startswith("assets/characters/king/"):
        return (512, 512)
    if rel.startswith("assets/ui/buttons/level_"):
        return (384, 384)
    if rel.startswith("assets/ui/icons/"):
        return (192, 192)
    return PNG_MAX.get(rel, size)

def resize_to_fit(image, target):
    tw, th = target
    scale = min(1.0, tw / image.width, th / image.height)
    if scale >= 1:
        return image
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)

def optimize_images():
    for rel in ASSET_FILES:
        path = RELEASE / rel
        with Image.open(path) as im:
            if path.suffix.lower() in {".jpg", ".jpeg"}:
                # Full-screen backgrounds remain 1920x1080; only excess pixels/metadata are removed.
                im = im.convert("RGB").resize((1920, 1080), Image.Resampling.LANCZOS)
                im.save(path, "JPEG", quality=82, optimize=True, progressive=True)
            else:
                im = resize_to_fit(im, target_for(rel, im.size))
                im.save(path, "PNG", optimize=True, compress_level=9)

def circular_loop(src, dst, start, length, crossfade=2.0, bitrate="96k"):
    # Circular crossfade: output starts after the head, ends with tail->head crossfade,
    # so the file boundary continues naturally into the beginning.
    end = start + length
    mid_start = crossfade
    mid_end = length - crossfade
    filter_complex = (
        f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,asplit=3[h][m][t];"
        f"[h]atrim=start=0:end={crossfade},asetpts=PTS-STARTPTS[head];"
        f"[m]atrim=start={mid_start}:end={mid_end},asetpts=PTS-STARTPTS[mid];"
        f"[t]atrim=start={mid_end}:end={length},asetpts=PTS-STARTPTS[tail];"
        f"[tail][head]acrossfade=d={crossfade}:c1=tri:c2=tri[cross];"
        f"[mid][cross]concat=n=2:v=0:a=1[out]"
    )
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-filter_complex", filter_complex, "-map", "[out]",
        "-map_metadata", "-1", "-vn", "-c:a", "libmp3lame", "-b:a", bitrate, str(dst)
    )

def optimize_audio():
    # Short production loops; full source tracks remain in the repository for future editing.
    circular_loop(
        ROOT / "audio/music/music_menu_morning.mp3",
        RELEASE / "audio/music/music_menu_morning.mp3",
        start=0, length=42, crossfade=2, bitrate="96k",
    )
    # Final levels 1-20 loop is authored and cut manually. Preserve its exact 23.3 s form:
    # no extra trim and no crossfade. Only strip metadata and encode for production.
    dst = RELEASE / "audio/music/music_gameplay_calm_devonshire_moderato.mp3"
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(ROOT / "audio/music/music_gameplay_calm_devonshire_moderato.mp3"),
        "-map_metadata", "-1", "-vn", "-ar", "44100", "-ac", "2",
        "-c:a", "libmp3lame", "-b:a", "128k", "-write_xing", "1", str(dst)
    )
    # This track is already short and 96 kbps; re-encode only to strip metadata/artwork.
    dst = RELEASE / "audio/music/music_gameplay_magic_escape_room.mp3"
    dst.parent.mkdir(parents=True, exist_ok=True)
    run(
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(ROOT / "audio/music/music_gameplay_magic_escape_room.mp3"),
        "-map_metadata", "-1", "-vn", "-c:a", "libmp3lame", "-b:a", "96k", str(dst)
    )

def prepare_runtime_text():
    for path in (RELEASE / "src").rglob("*.js"):
        text = path.read_text(encoding="utf-8")
        text = text.replace("Музыка: Kevin MacLeod (incompetech.com)", "Музыка: Kevin MacLeod")
        text = text.replace("https://creativecommons.org/licenses/by/4.0/", "Creative Commons Attribution 4.0 International")
        path.write_text(text, encoding="utf-8")

def build():
    if RELEASE.exists():
        shutil.rmtree(RELEASE)
    RELEASE.mkdir(parents=True)

    for rel in RUNTIME_FILES + ASSET_FILES + AUDIO_COPY:
        copy_one(rel)

    optimize_images()
    optimize_audio()
    prepare_runtime_text()

    release_files = sorted(p for p in RELEASE.rglob("*") if p.is_file())
    rel_names = [p.relative_to(RELEASE).as_posix() for p in release_files]

    assert "index.html" in rel_names
    assert not any(name.startswith("archive_unused/") for name in rel_names)
    assert not any(name.endswith(".gitkeep") for name in rel_names)
    assert not any(re.search(r"[А-Яа-яЁё ]", name) for name in rel_names)
    assert "audio/music/music_event_adventureland.mp3" not in rel_names
    assert "audio/sfx/berry_pop.mp3" not in rel_names
    assert not any("queen/" in name for name in rel_names)

    unpacked = sum(p.stat().st_size for p in release_files)
    if OUTPUT.exists():
        OUTPUT.unlink()
    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in release_files:
            archive.write(path, path.relative_to(RELEASE).as_posix())

    with zipfile.ZipFile(OUTPUT) as archive:
        assert archive.testzip() is None
        assert archive.namelist().count("index.html") == 1

    zip_bytes = OUTPUT.stat().st_size
    # Guardrail: if future work accidentally re-adds source-sized media, fail the release.
    assert zip_bytes < 20_000_000, f"release unexpectedly large: {zip_bytes}"

    result = {
        "file": str(OUTPUT),
        "files": len(release_files),
        "unpacked_bytes": unpacked,
        "zip_bytes": zip_bytes,
        "sha256": hashlib.sha256(OUTPUT.read_bytes()).hexdigest(),
        "policy": "explicit allowlist + production image/audio optimization",
        "excluded_source_root": "archive_unused/",
    }
    MANIFEST.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    build()
