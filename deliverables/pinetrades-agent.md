# PineTrades Evaluator Agent

## What it does
- Crawls the live PineTrades YouTube channel with `yt-dlp`
- Pulls recent video metadata and opening transcript segments
- Builds a local PineTrades style snapshot
- Reviews a rendered output video against that snapshot
- Writes exact revision instructions when the output does not match strongly enough

## Main Files
- `agents/pinetrades-reviewer-prompt.md`
- `scripts/pinetrades_video_agent.py`

## Commands

Refresh the PineTrades reference snapshot:

```bash
python3 scripts/pinetrades_video_agent.py crawl
```

Review the current rendered video:

```bash
python3 scripts/pinetrades_video_agent.py review \
  --video out/final/trading-strategy-premium.mp4
```

Optional LLM refinement when `OPENAI_API_KEY` is configured:

```bash
python3 scripts/pinetrades_video_agent.py review \
  --video out/final/trading-strategy-premium.mp4 \
  --use-openai
```

## How the loop works
1. Run `crawl` to refresh the live PineTrades reference set.
2. Run `review` on the current output video.
3. Read the generated markdown review in `analysis/reviews/`.
4. Apply the listed changes to the Remotion project.
5. Re-render the video.
6. Run `review` again until the verdict passes.

## Why this is useful
- It turns PineTrades from a vague style reference into a repeatable benchmark.
- It gives Codex concrete change requests instead of generic feedback.
- It keeps the review grounded in current channel data.
