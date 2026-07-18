# Export Settings

## Delivery Target
- Container: `MP4`
- Resolution: `1920x1080`
- Frame rate: `60 fps`
- Codec: `H.264`
- Pixel format: `yuv420p`

## Render Settings
- Remotion render target: `--codec=h264 --crf=17`
- Keep the sanitized source clip at high quality before the Remotion timeline so chart text stays crisp.
- Source audio removed because the recording is effectively silent.
- Voiceover remains the only primary audio layer for a clean YouTube-ready mix.

## YouTube Rationale
- 1080p60 is the cleanest fit for this recording and preserves chart motion better than forcing a lower frame rate.
- CRF 17 keeps quality high enough for fine TradingView text and line work without creating an unnecessarily huge file.
