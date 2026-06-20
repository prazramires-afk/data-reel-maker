import { DataRow, ProjectSettings, BAR_COLORS, ThemeType } from "./types";
import { formatValue } from "./valueFormat";

interface BarState {
  label: string;
  value: number;
  targetValue: number;
  y: number;
  targetY: number;
  color: string;
  width: number;
  targetWidth: number;
  // Spring velocities — drives momentum, inertia, slight overshoot, smooth settling.
  vValue: number;
  vY: number;
  vWidth: number;
  // Leader spotlight scale (0..1 -> 1.0..1.08 visually).
  spotlight: number;
}

function getThemeColors(theme: ThemeType) {
  switch (theme) {
    case "light":
      return { bg: "#f8f9fa", text: "#1a1a2e", sub: "#6b7280", bar: "#e5e7eb" };
    case "neon":
      return { bg: "#0a0a1a", text: "#00ffff", sub: "#ff00ff", bar: "#1a1a3e" };
    case "greenscreen":
      return { bg: "#00ff00", text: "#ffffff", sub: "#e0e0e0", bar: "#00dd00" };
    default:
      return { bg: "#16161e", text: "#f0f0f5", sub: "#8888a0", bar: "#22222e" };
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function processData(data: DataRow[]) {
  const yearsSet = new Set<number>();
  const labelsSet = new Set<string>();
  const valueMap: Record<string, Record<number, number>> = {};

  data.forEach((row) => {
    yearsSet.add(row.year);
    labelsSet.add(row.label);
    if (!valueMap[row.label]) valueMap[row.label] = {};
    valueMap[row.label][row.year] = row.value;
  });

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  const labels = Array.from(labelsSet);

  return { years, labels, valueMap };
}

function interpolateValue(
  valueMap: Record<number, number>,
  years: number[],
  currentYear: number
): number {
  if (valueMap[currentYear] !== undefined) return valueMap[currentYear];

  let lower = years[0];
  let upper = years[years.length - 1];

  for (const y of years) {
    if (y <= currentYear) lower = y;
    if (y >= currentYear && upper === years[years.length - 1]) upper = y;
  }

  if (lower === upper) return valueMap[lower] || 0;
  const lv = valueMap[lower] || 0;
  const uv = valueMap[upper] || 0;
  const t = (currentYear - lower) / (upper - lower);
  return lv + (uv - lv) * t;
}

export interface AnimationController {
  play: () => void;
  pause: () => void;
  restart: () => void;
  destroy: () => void;
  isPlaying: () => boolean;
  recordVideo: (onProgress: (p: number) => void, audioStream?: MediaStream) => Promise<Blob>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getFittedTitleFontSize(
  ctx: CanvasRenderingContext2D,
  title: string,
  canvasWidth: number,
  baseSize: number,
  settings: ProjectSettings,
  maxWidth?: number,
) {
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
  const durationSeconds = 15 / speedMultiplier;
  const durationFit = durationSeconds < 12 ? 0.95 : durationSeconds > 18 ? 1.05 : 1;
  const scaledSize = baseSize * (settings.titleScale ?? 1) * durationFit;
  if (settings.titleAutoFit === false || !title.trim()) return Math.round(scaledSize);

  const safeMargin = Math.max(0.04, Math.min(settings.titleSafeMargin ?? 0.08, 0.2));
  const availableWidth = Math.min(maxWidth ?? Number.POSITIVE_INFINITY, canvasWidth * (1 - safeMargin * 2));
  let fittedSize = scaledSize;
  ctx.font = `bold ${Math.round(fittedSize)}px system-ui, sans-serif`;

  const measuredWidth = ctx.measureText(title).width;
  if (measuredWidth > availableWidth) {
    fittedSize *= availableWidth / measuredWidth;
  }

  const minSize = canvasWidth * 0.014;
  return Math.round(Math.max(minSize, fittedSize));
}

function getFittedCanvasFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseSize: number,
  maxWidth: number,
  weight = 700,
  minSize = 12,
) {
  let size = Math.max(minSize, baseSize);
  ctx.font = `${weight} ${Math.round(size)}px system-ui, sans-serif`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) size *= maxWidth / width;
  return Math.round(Math.max(minSize, size));
}

export function createBarRaceAnimation(
  canvas: HTMLCanvasElement,
  data: DataRow[],
  settings: ProjectSettings,
  onProgress?: (progress: number) => void,
  onComplete?: () => void,
  labelImages?: Record<string, HTMLImageElement>
): AnimationController {
  const ctx = canvas.getContext("2d")!;
  const { years, labels, valueMap } = processData(data);
  const theme = getThemeColors(settings.theme);
  const colorMap: Record<string, string> = {};
  labels.forEach((l, i) => (colorMap[l] = settings.labelColors?.[l] ?? BAR_COLORS[i % BAR_COLORS.length]));

  const baseDuration = 15; // fixed 15s base
  const speedMultiplier = settings.speed === "slow" ? 0.7 : settings.speed === "fast" ? 1.5 : 1;
  const totalMs = (baseDuration / speedMultiplier) * 1000;

  const maxBars = Math.min(labels.length, 10);
  // TikTok-viral compact layout: labels sit OUTSIDE the bar on the left (static gutter),
  // year sits to the right of the LOWEST bar, no giant background year.
  function metrics(w: number, h: number) {
    const sidePadding = Math.max(28, Math.round(w * 0.055));
    const rightPadding = Math.max(40, Math.round(w * 0.07));
    const labelGutter = Math.round(w * 0.34); // static left column; wide enough for country names
    const valueGutter = Math.round(w * 0.13); // reserve space so end labels never render past the canvas
    // Fit bars to height: maximize bar height so chart fills the frame, BUT
    // always reserve room at the bottom for the progress timeline + watermark
    // so nothing gets cut off in exported video.
    const titleSpace = Math.round(w * 0.14);
    const bottomSpace = Math.round(h * 0.13); // timeline + watermark gutter
    const available = h - titleSpace - bottomSpace;
    const barHeight = Math.max(20, Math.floor(available / (maxBars * 1.18)));
    const barGap = Math.round(barHeight * 0.18);
    return { barHeight, barGap, sidePadding, rightPadding, labelGutter, valueGutter, titleSpace, bottomSpace };
  }

  function getTopPadding(canvasWidth: number, canvasHeight: number) {
    const m = metrics(canvasWidth, canvasHeight);
    const totalBarsHeight = maxBars * m.barHeight + (maxBars - 1) * m.barGap;
    // Center bars between title space and reserved bottom space.
    const usable = canvasHeight - m.titleSpace - m.bottomSpace;
    const extra = Math.max(0, usable - totalBarsHeight);
    return m.titleSpace + extra / 2;
  }

  let playing = false;
  let startTime = 0;
  let elapsed = 0;
  let animFrame = 0;
  let showHook = true;

  // Cinematic state — drives leader spotlight, NEW KING flash, and year pop.
  let prevTopLabel: string | null = null;
  let kingFlashAt = -1; // ms timestamp of last new-leader event
  let kingFlashLabel: string | null = null;
  let lastWholeYear = Number.NaN;
  let yearPopAt = -1;
  // Slow-drifting background particles, seeded deterministically.
  const particles = Array.from({ length: 14 }, (_, i) => ({
    seed: i,
    baseX: (i * 137.5) % 100 / 100,
    baseY: (i * 73.3) % 100 / 100,
    radius: 0.004 + ((i * 17) % 9) / 1000,
    speed: 0.15 + ((i * 11) % 7) / 30,
  }));
  const cinematic = settings.cinematic !== false;

  const hookText = settings.title
    ? `${settings.title} — #1 will shock you`
    : "Top rankings — #1 will shock you";

  const initMetrics = metrics(canvas.width, canvas.height);
  const initTop = getTopPadding(canvas.width, canvas.height);
  const bars: BarState[] = labels.map((label, i) => ({
    label,
    value: 0,
    targetValue: 0,
    y: initTop + i * (initMetrics.barHeight + initMetrics.barGap),
    targetY: initTop + i * (initMetrics.barHeight + initMetrics.barGap),
    color: colorMap[label],
    width: 0,
    targetWidth: 0,
    vValue: 0,
    vY: 0,
    vWidth: 0,
    spotlight: 0,
  }));

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * Math.min(t, 1);
  }

  // Critically-near-damped spring step. Produces momentum + slight overshoot + settling.
  function springStep(current: number, target: number, velocity: number, stiffness = 0.18, damping = 0.74) {
    const force = (target - current) * stiffness;
    const newV = (velocity + force) * damping;
    return { value: current + newV, velocity: newV };
  }

  // Update spring physics for every bar. Called multiple times per frame during recording.
  function stepSprings(strength = 1) {
    const k = cinematic ? 0.18 : 0.22;
    const d = cinematic ? 0.74 : 0.7;
    bars.forEach((bar) => {
      const v = springStep(bar.value, bar.targetValue, bar.vValue, k * strength, d);
      bar.value = v.value; bar.vValue = v.velocity;
      const y = springStep(bar.y, bar.targetY, bar.vY, k * strength, d);
      bar.y = y.value; bar.vY = y.velocity;
      const w = springStep(bar.width, bar.targetWidth, bar.vWidth, k * strength, d);
      bar.width = w.value; bar.vWidth = w.velocity;
    });
  }

  function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function shadeColor(hex: string, percent: number): string {
    const [r, g, b] = hexToRgb(hex);
    const t = percent < 0 ? 0 : 255;
    const p = Math.abs(percent);
    const mix = (c: number) => Math.round((t - c) * p + c);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  }

  function drawBackground(w: number, h: number, progress: number) {
    // Layered gradient background — never plain.
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (settings.theme === "greenscreen") {
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(0, 0, w, h);
      return;
    }
    if (settings.theme === "light") {
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#eef0f4");
    } else if (settings.theme === "neon") {
      grad.addColorStop(0, "#0b0420");
      grad.addColorStop(1, "#1a0a3a");
    } else {
      grad.addColorStop(0, "#0e0e18");
      grad.addColorStop(1, "#1a1a2e");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    if (!cinematic) return;

    // Slow-drifting glow blobs (the "particles" layer).
    const t = progress * Math.PI * 2;
    particles.forEach((p) => {
      const x = (p.baseX + Math.sin(t * p.speed + p.seed) * 0.06) * w;
      const y = (p.baseY + Math.cos(t * p.speed * 0.7 + p.seed) * 0.05) * h;
      const r = p.radius * w * 8;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, settings.theme === "light" ? "rgba(124,92,252,0.10)" : "rgba(124,180,252,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vignette.
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)");
    vg.addColorStop(1, settings.theme === "light" ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.55)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  function render(progress: number) {
    const w = canvas.width;
    const h = canvas.height;
    const { barHeight, barGap, sidePadding, rightPadding, labelGutter, valueGutter } = metrics(w, h);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Layered background (gradient + particles + vignette).
    drawBackground(w, h, progress);

    // Keep the data layer locked inside the export safe area. Backgrounds can move,
    // but scaling foreground content causes MP4/WebM edge clipping on long labels/values.

    // Hook text fade out in first 15%
    if (settings.showIntro && showHook && progress < 0.15) {
      const hookAlpha = progress < 0.1 ? 1 : 1 - (progress - 0.1) / 0.05;
      ctx.save();
      ctx.globalAlpha = hookAlpha;
      ctx.fillStyle = theme.text;
      ctx.font = `bold ${Math.round(w * 0.045)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = hookText.match(/.{1,30}(\s|$)/g) || [hookText];
      lines.forEach((line, i) => {
        ctx.fillText(line.trim(), w / 2, h / 2 - 10 + i * 28);
      });
      ctx.restore();
      if (progress < 0.08) {
        return;
      }
    }

    const dataProgress = Math.max(0, (progress - 0.12) / 0.85);
    const yearRange = years[years.length - 1] - years[0];
    const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

    // Calculate values
    const barData = labels.map((label) => ({
      label,
      value: interpolateValue(valueMap[label] || {}, years, currentYear),
    }));

    // Sort descending
    barData.sort((a, b) => b.value - a.value);
    const visible = barData.slice(0, maxBars);
    const maxVal = Math.max(...visible.map((b) => b.value), 1);
    // Bars start after the static label gutter on the left.
    const barStartX = sidePadding + labelGutter;
    const barAreaWidth = w - barStartX - rightPadding - valueGutter;

    // Update targets
    const topPad = getTopPadding(w, h);
    visible.forEach((bd, i) => {
      const bar = bars.find((b) => b.label === bd.label)!;
      bar.targetValue = bd.value;
      bar.targetY = topPad + i * (barHeight + barGap);
      bar.targetWidth = (bd.value / maxVal) * barAreaWidth;
    });

    // Spring physics step (live playback). Recording calls stepSprings() externally.
    stepSprings(1);

    // NEW KING detection: trigger when the rank-1 target label changes.
    const topLabel = visible[0]?.label ?? null;
    if (topLabel && prevTopLabel && topLabel !== prevTopLabel && progress > 0.15 && progress < 0.95) {
      kingFlashAt = elapsed;
      kingFlashLabel = topLabel;
    }
    if (topLabel) prevTopLabel = topLabel;

    // Year-pop trigger on integer year change.
    const wholeYear = Math.round(currentYear);
    if (wholeYear !== lastWholeYear) {
      if (!Number.isNaN(lastWholeYear)) yearPopAt = elapsed;
      lastWholeYear = wholeYear;
    }

    // Title — positioned above the bars area
    const titleY = Math.max(sidePadding, topPad - Math.round(w * 0.09));
    if (settings.title) {
      ctx.fillStyle = theme.text;
      const titleMaxWidth = w - sidePadding - rightPadding - w * 0.16;
      const titleFontSize = getFittedTitleFontSize(
        ctx,
        settings.title,
        w,
        w * 0.05,
        settings,
        titleMaxWidth,
      );
      ctx.font = `bold ${titleFontSize}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(settings.title, sidePadding, titleY, titleMaxWidth);
    }

    // Bars + static left-side labels (TikTok viral style)
    const visibleLabels = new Set(visible.map((v) => v.label));
    const labelGap = Math.round(w * 0.018);
    const labelRightX = barStartX - labelGap;
    const labelMaxWidth = Math.max(40, labelRightX - sidePadding);
    const labelFontSize = Math.round(barHeight * 0.36);
    const valueFontSize = Math.round(barHeight * 0.34);
    const leaderLabel = visible[0]?.label ?? null;
    const isFinal = progress >= 0.97;
    bars.forEach((bar) => {
      if (!visibleLabels.has(bar.label)) return;

      // Spotlight: leader gets 1.08x bar height + glow + brighter color; others dimmer.
      const isLeader = bar.label === leaderLabel;
      const spotlightTarget = isLeader ? 1 : 0;
      bar.spotlight += (spotlightTarget - bar.spotlight) * 0.12;
      const scale = cinematic ? 1 + 0.08 * bar.spotlight : 1;
      const bh = barHeight * scale;
      const yOffset = (bh - barHeight) / 2;
      const drawY = bar.y - yOffset;
      const x = barStartX;
      const roundRadius = Math.round(bh * 0.22);
      const imgSize = bh - Math.round(bh * 0.12);
      const dim = cinematic ? 1 - 0.25 * (1 - bar.spotlight) : 1;

      // Static label on the LEFT (outside the bar), animates Y smoothly with the bar.
      if (settings.showLabels) {
        ctx.save();
        ctx.globalAlpha = dim;
        ctx.fillStyle = theme.text;
        const ls = getFittedCanvasFontSize(
          ctx,
          bar.label,
          labelFontSize * (isLeader && cinematic ? 1.06 : 1),
          labelMaxWidth,
          700,
          Math.max(13, Math.round(w * 0.016)),
        );
        ctx.font = `700 ${ls}px system-ui, sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(bar.label, labelRightX, bar.y + barHeight / 2, labelMaxWidth);
        ctx.restore();
      }

      // Bar with gradient + shadow + leader glow.
      ctx.save();
      if (cinematic) {
        ctx.shadowColor = bar.color;
        ctx.shadowBlur = isLeader ? bh * 0.55 : bh * 0.18;
        ctx.shadowOffsetY = bh * 0.05;
      }
      const bw = Math.max(bar.width, 2);
      const bg = ctx.createLinearGradient(x, drawY, x, drawY + bh);
      bg.addColorStop(0, shadeColor(bar.color, isLeader ? 0.25 : 0.12));
      bg.addColorStop(1, shadeColor(bar.color, isLeader ? -0.05 : -0.15));
      ctx.globalAlpha = dim;
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.roundRect(x, drawY, bw, bh, [roundRadius * 0.4, roundRadius, roundRadius, roundRadius * 0.4]);
      ctx.fill();
      ctx.restore();

      // Soft top highlight for premium feel.
      if (cinematic) {
        ctx.save();
        ctx.globalAlpha = 0.18 * dim;
        const hg = ctx.createLinearGradient(x, drawY, x, drawY + bh * 0.4);
        hg.addColorStop(0, "rgba(255,255,255,0.6)");
        hg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.roundRect(x, drawY, bw, bh * 0.4, [roundRadius * 0.4, roundRadius, 0, 0]);
        ctx.fill();
        ctx.restore();
      }

      const img = labelImages?.[bar.label];
      if (img && img.complete && img.naturalWidth > 0) {
        const imgX = x + Math.round(bh * 0.06);
        const imgY = drawY + Math.round(bh * 0.06);
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.beginPath();
        ctx.arc(imgX + imgSize / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
        ctx.restore();
      }

      // Crown for the leader (cinematic only).
      if (cinematic && isLeader) {
        const cs = bh * 0.5;
        const cx = labelRightX;
        const cy = drawY - cs * 0.2;
        ctx.save();
        ctx.fillStyle = "#ffd24a";
        ctx.font = `${Math.round(cs)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText("👑", cx, cy + cs);
        ctx.restore();
      }

      // Value: at end of bar (rolling counter via spring `bar.value`).
      if (settings.showValues) {
        ctx.save();
        ctx.globalAlpha = dim;
        ctx.fillStyle = theme.text;
        const valueText = formatValue(bar.value, settings.valueFormat);
        const valueX = x + bw + Math.round(w * 0.012);
        const valueMaxWidth = Math.max(28, w - rightPadding - valueX);
        const vs = getFittedCanvasFontSize(
          ctx,
          valueText,
          valueFontSize * (isLeader && cinematic ? 1.12 : 1),
          valueMaxWidth,
          800,
          Math.max(11, Math.round(w * 0.014)),
        );
        ctx.font = `800 ${vs}px system-ui, sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(valueText, valueX, bar.y + barHeight / 2, valueMaxWidth);
        ctx.restore();
      }
    });

    // Year — sits inline at the right edge of the lowest bar row.
    // Pops on each integer change. Sized to fit within the bar row so it
    // never overflows the canvas in exported video.
    const visibleCount = Math.min(visible.length, maxBars);
    const lastIndex = Math.max(0, visibleCount - 1);
    const lastY = topPad + lastIndex * (barHeight + barGap);
    const yearFontSize = Math.round(barHeight * 0.95);
    const yearAge = yearPopAt < 0 ? 999 : (elapsed - yearPopAt) / 1000;
    const pop = cinematic && yearAge < 0.35 ? 1 + 0.18 * (1 - yearAge / 0.35) : 1;
    const yearAlpha = cinematic ? 0.92 : 1;
    const yearY = lastY + barHeight / 2;
    const yearX = w - rightPadding;
    ctx.save();
    ctx.globalAlpha = yearAlpha;
    ctx.fillStyle = theme.text;
    ctx.font = `900 ${Math.round(yearFontSize * pop)}px system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.round(currentYear).toString(), yearX, yearY);
    ctx.restore();

    // Progress timeline (bottom).
    if (cinematic && years.length > 1) {
      const trackY = h - Math.round(h * 0.06);
      const trackX1 = sidePadding;
      const trackX2 = w - rightPadding;
      const trackW = trackX2 - trackX1;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = Math.max(2, Math.round(h * 0.003));
      ctx.beginPath();
      ctx.moveTo(trackX1, trackY);
      ctx.lineTo(trackX2, trackY);
      ctx.stroke();

      const dotX = trackX1 + trackW * Math.min(dataProgress, 1);
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.moveTo(trackX1, trackY);
      ctx.lineTo(dotX, trackY);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#7c5cfc";
      ctx.shadowBlur = h * 0.015;
      ctx.beginPath();
      ctx.arc(dotX, trackY, Math.max(4, Math.round(h * 0.007)), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = `600 ${Math.round(h * 0.018)}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(String(years[0]), trackX1, trackY + h * 0.015);
      ctx.textAlign = "right";
      ctx.fillText(String(years[years.length - 1]), trackX2, trackY + h * 0.015);
      ctx.restore();
    }

    // NEW KING flash overlay.
    if (cinematic && kingFlashAt >= 0 && kingFlashLabel) {
      const age = (elapsed - kingFlashAt) / 1000;
      if (age < 1.0) {
        const a = age < 0.15 ? age / 0.15 : age > 0.75 ? 1 - (age - 0.75) / 0.25 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        // Flash veil
        if (age < 0.1) {
          ctx.fillStyle = `rgba(255,255,255,${0.18 * (1 - age / 0.1)})`;
          ctx.fillRect(0, 0, w, h);
        }
        // NEW KING text
        const cx = w / 2;
        const cy = h * 0.18;
        const pop2 = 1 + 0.1 * Math.sin(age * Math.PI);
        ctx.fillStyle = "#ffd24a";
        ctx.font = `900 ${Math.round(w * 0.055 * pop2)}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 20;
        ctx.fillText(`👑 NEW LEADER`, cx, cy);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${Math.round(w * 0.038)}px system-ui, sans-serif`;
        ctx.fillText(kingFlashLabel, cx, cy + w * 0.05);
        ctx.restore();
      } else {
        kingFlashAt = -1;
        kingFlashLabel = null;
      }
    }

    // Final scene highlight — winner gets a fat radial glow.
    if (cinematic && isFinal && leaderLabel) {
      const leaderBar = bars.find((b) => b.label === leaderLabel);
      if (leaderBar) {
        const cx = barStartX + leaderBar.width / 2;
        const cy = leaderBar.y + barHeight / 2;
        const rad = Math.max(barHeight * 2, w * 0.15);
        const fg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        fg.addColorStop(0, `${leaderBar.color}55`);
        fg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
    }

    // Watermark (draggable) — can be hidden by premium users
    if (!settings.hideWatermark) {
      const wp = settings.watermarkPos ?? { x: 0.5, y: 0.97 };
      ctx.fillStyle = theme.sub;
      ctx.globalAlpha = 0.4;
      ctx.font = `500 ${Math.round(w * 0.025)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Made with datatovid.com", w * wp.x, h * wp.y);
      ctx.globalAlpha = 1;
    }
  }

  function tick(timestamp: number) {
    if (!playing) return;
    if (!startTime) startTime = timestamp;
    elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / totalMs, 1);

    render(progress);
    onProgress?.(progress);

    if (progress >= 1) {
      playing = false;
      onComplete?.();
      return;
    }

    animFrame = requestAnimationFrame(tick);
  }

  // Render first frame
  render(0);

  return {
    play() {
      if (playing) return;
      playing = true;
      showHook = elapsed === 0;
      startTime = 0;
      const savedElapsed = elapsed;
      animFrame = requestAnimationFrame((ts) => {
        startTime = ts - savedElapsed;
        tick(ts);
      });
    },
    pause() {
      playing = false;
      cancelAnimationFrame(animFrame);
    },
    restart() {
      playing = false;
      cancelAnimationFrame(animFrame);
      elapsed = 0;
      startTime = 0;
      showHook = true;
      prevTopLabel = null;
      kingFlashAt = -1;
      kingFlashLabel = null;
      lastWholeYear = Number.NaN;
      yearPopAt = -1;
      const rm = metrics(canvas.width, canvas.height);
      const resetTop = getTopPadding(canvas.width, canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.vValue = 0; b.vWidth = 0; b.vY = 0; b.spotlight = 0;
        b.y = resetTop + labels.indexOf(b.label) * (rm.barHeight + rm.barGap);
      });
      render(0);
    },
    destroy() {
      playing = false;
      cancelAnimationFrame(animFrame);
    },
    isPlaying: () => playing,
    async recordVideo(onRecordProgress: (p: number) => void, audioStream?: MediaStream): Promise<Blob> {
      // Reset state for recording
      playing = false;
      cancelAnimationFrame(animFrame);
      elapsed = 0;
      startTime = 0;
      showHook = true;
      prevTopLabel = null;
      kingFlashAt = -1;
      kingFlashLabel = null;
      lastWholeYear = Number.NaN;
      yearPopAt = -1;
      const rm = metrics(canvas.width, canvas.height);
      const recTop = getTopPadding(canvas.width, canvas.height);
      bars.forEach((b) => {
        b.value = 0;
        b.width = 0;
        b.vValue = 0; b.vWidth = 0; b.vY = 0; b.spotlight = 0;
        b.y = recTop + labels.indexOf(b.label) * (rm.barHeight + rm.barGap);
      });

      const fps = 30;
      const totalFrames = Math.round((totalMs / 1000) * fps);
      const frameDuration = 1000 / fps;

      // Try webm with VP9, fallback to VP8
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm;codecs=vp8';

      const stream = canvas.captureStream(fps);
      if (audioStream) {
        audioStream.getAudioTracks().forEach(t => stream.addTrack(t));
      }
      const recorder = new MediaRecorder(stream, {
        mimeType,
        // Higher bitrate so portrait HD exports stay crisp for social media.
        videoBitsPerSecond: 12_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<Blob>((resolve, reject) => {
        recorder.onerror = () => reject(new Error('Recording failed'));
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };

        recorder.start(250);

        const track = stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };

        (async () => {
          try {
            for (let frame = 0; frame <= totalFrames; frame++) {
              const progress = Math.min(frame / totalFrames, 1);

              // Simulate elapsed time for lerp-based animation
              // Run multiple lerp iterations per frame for smooth catch-up
              const targetElapsed = progress * totalMs;
              elapsed = targetElapsed;

              // Update bar targets based on progress
              const dataProgress = Math.max(0, (progress - 0.12) / 0.85);
              const yearRange = years[years.length - 1] - years[0];
              const currentYear = years[0] + yearRange * Math.min(dataProgress, 1);

              const barData = labels.map((label) => ({
                label,
                value: interpolateValue(valueMap[label] || {}, years, currentYear),
              }));
              barData.sort((a, b) => b.value - a.value);
              const visible = barData.slice(0, maxBars);
              const maxVal = Math.max(...visible.map((b) => b.value), 1);
              const recM = metrics(canvas.width, canvas.height);
              const barStartX = recM.sidePadding + recM.labelGutter;
              const barAreaWidth = canvas.width - barStartX - recM.rightPadding - recM.valueGutter;

              const recTopPad = getTopPadding(canvas.width, canvas.height);
              visible.forEach((bd, i) => {
                const bar = bars.find((b) => b.label === bd.label)!;
                bar.targetValue = bd.value;
                bar.targetY = recTopPad + i * (recM.barHeight + recM.barGap);
                bar.targetWidth = (bd.value / maxVal) * barAreaWidth;
              });

              // Dynamic speed: slow physics during big rank shake-ups to add anticipation.
              const totalDelta = bars.reduce(
                (acc, b) => acc + Math.abs(b.targetY - b.y) + Math.abs(b.targetWidth - b.width) * 0.5,
                0,
              );
              const big = totalDelta > canvas.height * 0.4;
              const strength = big ? 0.7 : 1;
              // Multiple spring iterations per frame so motion fully converges between frames.
              for (let s = 0; s < 5; s++) stepSprings(strength);

              render(progress);
              track.requestFrame?.();
              onRecordProgress(progress);

              if (frame < totalFrames) {
                await wait(frameDuration);
              }
            }

            await wait(300);
            recorder.stop();
          } catch (error) {
            reject(error instanceof Error ? error : new Error("Recording failed"));
          }
        })();
      });
    },
  };
}
