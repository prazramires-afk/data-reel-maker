## Add "Event Timeline" video type

A new animation for chronological text-based events (like your Roman history dataset) — dated milestone cards revealing along a timeline, with support for `BC`/`AD` years.

### CSV schema (new)

```
Year,Event,Description
753 BC,Founding of Rome,Traditional founding of Rome by Romulus.
509 BC,Roman Republic Established,Monarchy abolished...
264 BC,First Punic War Begins,Rome enters its first major war against Carthage.
```

- Year accepts `753 BC`, `-753`, `509 BC`, `2024`, `2024 AD` (stored internally as signed integer).
- Event = short headline shown in a card.
- Description = 1–2 sentence caption.

### Animation

```text
   753 BC ─●───────●───────●───────●────── 60 BC
                   ▲
           ┌───────────────────┐
           │  Founding of Rome │  ← current event card
           │  Traditional...   │     fades in, holds, fades out
           └───────────────────┘
```

- Vertical line/horizontal line depending on aspect ratio.
- Events reveal one-by-one in chronological order, evenly spaced across the total duration.
- Big date shown per event; description auto-wraps.
- Reuses existing theme colors, watermark, background image, title & text-color settings.

### Technical changes

1. **`src/lib/types.ts`**
   - Add `"event_timeline"` to `VideoType`.
   - Add `EventRow { year: number; title: string; description: string }`.
   - Add optional `Project.events?: EventRow[]` (used only when `type === "event_timeline"`; `data` stays as-is for other types).
   - Register in `VIDEO_TYPES` with icon copy: *"Dated events unfolding one by one"*.

2. **`src/lib/parseEventCSV.ts`** (new)
   - Parser + validator for `Year,Event,Description` with BC/AD support.
   - Returns `{ rows, issues, hasErrors }` like `validateCSV`.

3. **`src/lib/eventTimelineAnimation.ts`** (new)
   - `createEventTimelineAnimation(canvas, events, settings, onProgress, onComplete)` matching the `AnimationController` interface (play/pause/restart/destroy/recordVideo).
   - Reveals events sequentially with fade-in cards along a line; supports theme, background image, watermark, title, text colors, speed multiplier.

4. **`src/pages/Create.tsx`**
   - New state `events: EventRow[]` and CSV path for the new type.
   - Step 1 UI switches to Event fields (Year / Event / Description) when `videoType === "event_timeline"`.
   - CSV textarea placeholder changes to the event schema; uses the new parser.
   - Preview + Export use `createEventTimelineAnimation` and pass `events` instead of `data`.
   - `canProceed` checks event rows for that type.
   - Save/load: persist `events` on `Project`.

5. **Sample data**
   - Add a `ROMAN_HISTORY_SAMPLE` in `src/lib/sampleData.ts` and show as a Sample tile when the Event Timeline type is selected.

### Out of scope (to keep this focused)

- No changes to the existing numeric Timeline video type (it remains for value-over-time datasets).
- No SEO/community-page updates for event timelines yet — those can follow once the animation is validated.
- No per-event image uploads in this pass (can be added later, same as label images).

Reply "go" to build, or tell me what to adjust (e.g. vertical vs horizontal layout, card style, whether to allow numeric years without BC/AD).
