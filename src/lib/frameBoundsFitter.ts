/**
 * Frame-bounds fitter — measures text/graphics and scales or repositions
 * elements so they never crop against the canvas edges in exported video.
 *
 * Used by the animation engines (bar race, top10, comparison, timeline) to
 * guarantee every rendered element fits the target resolution regardless of
 * label length, locale, or aspect ratio.
 */

export interface FrameBounds {
  width: number;
  height: number;
  /** Inset from each edge that elements must stay inside of. */
  padding?: number;
}

export interface FittedTextOptions {
  text: string;
  /** Anchor X in canvas pixels. */
  x: number;
  /** Anchor Y in canvas pixels. */
  y: number;
  baseFontSize: number;
  minFontSize?: number;
  weight?: number | string;
  fontFamily?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  /** Optional override for the max width this text may occupy. */
  maxWidth?: number;
  /** Optional override for the max height this text may occupy. */
  maxHeight?: number;
}

export interface FittedTextResult {
  fontSize: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Final font string ready to assign to ctx.font. */
  font: string;
}

/**
 * Returns the largest font size (<= baseFontSize, >= minFontSize) that keeps
 * `text` inside `maxWidth`. Pure measurement — does not draw.
 */
export function fitFontSizeToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  baseFontSize: number,
  maxWidth: number,
  weight: number | string = 700,
  fontFamily = "system-ui, sans-serif",
  minFontSize = 10,
): number {
  if (!text) return Math.round(baseFontSize);
  let size = Math.max(minFontSize, baseFontSize);
  ctx.font = `${weight} ${Math.round(size)}px ${fontFamily}`;
  const measured = ctx.measureText(text).width;
  if (measured > maxWidth && measured > 0) {
    size = Math.max(minFontSize, size * (maxWidth / measured));
  }
  return Math.round(size);
}

/**
 * Computes the final font size + anchor position so the text's bounding box
 * fits entirely inside `bounds` (respecting `bounds.padding`). It does TWO
 * things together:
 *   1. Shrinks the font so width <= available width AND height <= available height
 *   2. Repositions the anchor so the resulting box never crosses an edge
 *
 * Apply the returned `font`/`x`/`y` directly to ctx — no further clamping needed.
 */
export function fitTextToBounds(
  ctx: CanvasRenderingContext2D,
  bounds: FrameBounds,
  opts: FittedTextOptions,
): FittedTextResult {
  const pad = bounds.padding ?? 0;
  const left = pad;
  const right = bounds.width - pad;
  const top = pad;
  const bottom = bounds.height - pad;

  const align = opts.align ?? "left";
  const baseline = opts.baseline ?? "alphabetic";
  const weight = opts.weight ?? 700;
  const family = opts.fontFamily ?? "system-ui, sans-serif";
  const minSize = Math.max(8, opts.minFontSize ?? 10);

  // Available width depending on alignment.
  let availW: number;
  switch (align) {
    case "center":
      availW = Math.min(opts.x - left, right - opts.x) * 2;
      break;
    case "right":
    case "end":
      availW = opts.x - left;
      break;
    default:
      availW = right - opts.x;
  }
  if (opts.maxWidth !== undefined) availW = Math.min(availW, opts.maxWidth);
  availW = Math.max(8, availW);

  // Available height depending on baseline.
  let availH: number;
  switch (baseline) {
    case "top":
    case "hanging":
      availH = bottom - opts.y;
      break;
    case "bottom":
    case "ideographic":
      availH = opts.y - top;
      break;
    default: // middle / alphabetic — approximate symmetric
      availH = Math.min(opts.y - top, bottom - opts.y) * 2;
  }
  if (opts.maxHeight !== undefined) availH = Math.min(availH, opts.maxHeight);
  availH = Math.max(8, availH);

  // 1) Fit to width.
  let size = fitFontSizeToWidth(ctx, opts.text, opts.baseFontSize, availW, weight, family, minSize);
  // 2) Fit to height (cap font size at availH * ~1.0; cap-height ~0.72em).
  if (size > availH) size = Math.max(minSize, Math.floor(availH));

  ctx.font = `${weight} ${size}px ${family}`;
  const measured = ctx.measureText(opts.text);
  const w = Math.min(measured.width, availW);

  // Approximate visual height — canvas measureText height support is uneven.
  const ascent = measured.actualBoundingBoxAscent || size * 0.78;
  const descent = measured.actualBoundingBoxDescent || size * 0.22;
  const h = ascent + descent;

  // 3) Reposition anchor so the rendered box stays inside bounds.
  let x = opts.x;
  let y = opts.y;

  // Horizontal clamp
  let boxLeft: number;
  let boxRight: number;
  if (align === "center") {
    boxLeft = x - w / 2;
    boxRight = x + w / 2;
  } else if (align === "right" || align === "end") {
    boxLeft = x - w;
    boxRight = x;
  } else {
    boxLeft = x;
    boxRight = x + w;
  }
  if (boxLeft < left) x += left - boxLeft;
  else if (boxRight > right) x -= boxRight - right;

  // Vertical clamp
  let boxTop: number;
  let boxBottom: number;
  if (baseline === "top" || baseline === "hanging") {
    boxTop = y;
    boxBottom = y + h;
  } else if (baseline === "bottom" || baseline === "ideographic") {
    boxTop = y - h;
    boxBottom = y;
  } else {
    boxTop = y - ascent;
    boxBottom = y + descent;
  }
  if (boxTop < top) y += top - boxTop;
  else if (boxBottom > bottom) y -= boxBottom - bottom;

  return {
    fontSize: size,
    x,
    y,
    width: w,
    height: h,
    font: `${weight} ${size}px ${family}`,
  };
}

/**
 * Clamps an arbitrary rectangular graphic (image, icon, badge) so it sits
 * fully inside bounds. Scales uniformly if it's larger than the available
 * area, then nudges the top-left so no edge crosses bounds.
 */
export interface FittedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export function fitRectToBounds(
  bounds: FrameBounds,
  rect: { x: number; y: number; width: number; height: number },
): FittedRect {
  const pad = bounds.padding ?? 0;
  const maxW = bounds.width - pad * 2;
  const maxH = bounds.height - pad * 2;

  let scale = 1;
  if (rect.width > maxW) scale = Math.min(scale, maxW / rect.width);
  if (rect.height > maxH) scale = Math.min(scale, maxH / rect.height);

  const w = rect.width * scale;
  const h = rect.height * scale;

  let x = rect.x;
  let y = rect.y;
  if (x < pad) x = pad;
  if (y < pad) y = pad;
  if (x + w > bounds.width - pad) x = bounds.width - pad - w;
  if (y + h > bounds.height - pad) y = bounds.height - pad - h;

  return { x, y, width: w, height: h, scale };
}