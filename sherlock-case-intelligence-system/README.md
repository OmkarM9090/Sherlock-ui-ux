# SHERLOCK // Case Intelligence

A Victorian-detective-inspired investigation workspace. The landing sequence uses the short desk and evidence-paper films in `public/film/`, followed by the existing evidence, suspect, timeline, constellation, and deduction experience.

## Development

```sh
npm ci
npm run dev
```

Production output is built with `npm run build`. The opening is a ten-frame, locally snapped ScrollTrigger sequence: the desk film autoplays muted, and the paper reel is requested only as the viewer scrolls into its transition. Bundled WebP posters keep the scene present if video cannot load. Users can skip the opening, reduced-motion preferences switch it to a still hero, and gesture mode/camera access remain opt-in.

## Scroll-scrub video optimization

For the smoothest seeking while scrubbing an intro clip, re-encode it with a very short keyframe interval. The current clips are H.264, muted, and encoded with a two-frame GOP for responsive seeking. A source clip can be re-encoded with FFmpeg using:

```sh
ffmpeg -i input.mp4 -an -c:v libx264 -preset slow -crf 20 -g 2 -keyint_min 2 -sc_threshold 0 -movflags +faststart output.mp4
```

`-g 2` keeps keyframes two frames apart for highly responsive scrubbing, while `-movflags +faststart` places MP4 metadata near the beginning of the file. Keep a poster image beside each video so the experience remains useful before media is ready or when video is unavailable.
