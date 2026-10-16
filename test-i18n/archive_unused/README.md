# archive_unused

This directory stores source assets that are **not part of the current production build**.

They were moved out of active `assets/` and `audio/` so future Yandex archives cannot accidentally pick them up by copying whole directories.

- `future/` — assets planned for later features (for example Queen character skins).
- `legacy_assets/` — old or currently unused UI/background variants kept only as source material.
- `audio_sources/` — full source music kept for future editing; not shipped in the game.
- `audio_alternatives/` — alternate SFX kept for comparison; not shipped in the game.

Production archives must be assembled only through `scripts/build_release.py` / the canonical Yandex workflow and its explicit allowlist.
