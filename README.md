# Remotion Trading Documentary Studio

Remotion video factory for finance YouTube — code-rendered trading documentaries and reels with Python pipelines for AI voiceover, AI stills, music beds, and audio-timed React compositions.

## Features

- Code-rendered documentary and short-form reel compositions authored in React + Remotion (`src/*.tsx`).
- Audio-timed animation: narration is generated first, then each scene is driven by JSON timing maps (`src/*AudioTiming.json`) so on-screen text and motion stay locked to the voiceover.
- AI voiceover pipelines with multiple backends — Venice, ElevenLabs (clone + Hindi), Voicebox, and macOS `say` — under `scripts/`.
- AI still-image generation for backplates and storyboards via the Venice image API.
- Procedural music-bed and suspense-bed generators for scoring each film.
- Bilingual support (English + Hindi) including transliteration and TTS-normalization helpers.
- Turn-key `npm run render:*` scripts that chain voice + stills + bed generation into a single MP4 render.
- A "PineTrades" analysis agent for crawling reference channels and reviewing rendered videos against a style guide.

## Stack

- Remotion 4 + React 18 + TypeScript (video compositions and rendering)
- Node.js / npm (orchestration scripts in `package.json`)
- Python 3 (`requests`) for the voice, stills, and music-bed pipelines
- ffmpeg (invoked by the Python pipelines for audio assembly)

## Getting started

Install JavaScript dependencies and open the Remotion studio:

```bash
npm install
npm run studio
```

Render a composition (chains the Python asset pipelines, then Remotion):

```bash
npm run render:reel
npm run render:wealth
npm run render:stock-market-dark
npm run render:stock-market-english
```

The Python pipelines expect API keys in the environment (see `.env.example`):

```bash
export VENICE_API_KEY=your_key_here
export ELEVENLABS_API_KEY=your_key_here
pip install requests
```

> Note: some pipeline scripts contain absolute paths and voice IDs from the original authoring machine. Adjust the `ROOT` path and voice/model settings at the top of each script in `scripts/` before running.

## Notes

Trading automation is infrastructure, not financial advice. No profit guarantees. Test in dry-run/paper before live.

## Author

Built by [Jayadev Rana](https://jayadevrana.in) — @bluealgocapital · [YouTube](https://www.youtube.com/@jayadevrana3657) · [GitHub](https://github.com/jayadevrana)

## License

MIT © 2026 [Jayadev Rana](https://jayadevrana.in). Free to use, modify and share: please keep the copyright notice and credit **Jayadev Rana** with a link back to this repository.
