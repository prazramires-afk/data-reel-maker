import { useEffect, useRef, useState } from "react";
import { GDP_SAMPLE, FOOTBALL_SAMPLE, POPULATION_SAMPLE } from "@/lib/sampleData";
import { DataRow } from "@/lib/types";

export type LivePreviewMode = "bar_race" | "top10" | "timeline" | "comparison";

const COLORS = ["#7c5cfc", "#3b9dff", "#f97316", "#22c55e", "#ef4444", "#eab308"];
const BG = "#0f0f17";
const TEXT = "#f0f0f5";
const SUB = "#8888a0";

function processData(data: DataRow[]) {
  const yearsSet = new Set<number>();
  const labelsSet = new Set<string>();
  const valueMap: Record<string, Record<number, number>> = {};
  data.forEach((r) => {
    yearsSet.add(r.year);
    labelsSet.add(r.label);
    if (!valueMap[r.label]) valueMap[r.label] = {};
    valueMap[r.label][r.year] = r.value;
  });
  return {
    years: [...yearsSet].sort((a, b) => a - b),
    labels: [...labelsSet],
    valueMap,
  };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function interp(vm: Record<number, number>, years: number[], y: number) {
  if (vm[y] !== undefined) return vm[y];
  let lo = years[0], hi = years[years.length - 1];
  for (const yr of years) {
    if (yr <= y) lo = yr;
    if (yr >= y && hi === years[years.length - 1]) hi = yr;
  }
  if (lo === hi) return vm[lo] || 0;
  const t = (y - lo) / (hi - lo);
  return (vm[lo] || 0) + ((vm[hi] || 0) - (vm[lo] || 0)) * t;
}

function drawBarRace(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, data: DataRow[], title: string) {
  const { years, labels, valueMap } = processData(data);
  const cycle = (t % 1);
  const span = years[years.length - 1] - years[0];
  const currentYear = years[0] + span * cycle;
  const rows = labels.map((l, i) => ({
    label: l,
    value: interp(valueMap[l] || {}, years, currentYear),
    color: COLORS[i % COLORS.length],
  })).sort((a, b) => b.value - a.value).slice(0, 5);
  const max = Math.max(...rows.map((r) => r.value), 1);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const padX = 12, padTop = 22, padBottom = 18;
  const rowH = (h - padTop - padBottom) / 5;
  rows.forEach((r, i) => {
    const y = padTop + i * rowH + 2;
    const bw = ((w - padX * 2 - 56) * r.value) / max;
    ctx.fillStyle = r.color;
    ctx.fillRect(padX + 48, y, Math.max(2, bw), rowH - 6);
    ctx.fillStyle = TEXT;
    ctx.font = "600 9px ui-sans-serif, system-ui";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(r.label, padX + 44, y + (rowH - 6) / 2);
    ctx.textAlign = "left";
    ctx.fillStyle = SUB;
    ctx.fillText(Math.round(r.value).toString(), padX + 52 + bw, y + (rowH - 6) / 2);
  });
  ctx.fillStyle = TEXT;
  ctx.font = "700 11px ui-sans-serif, system-ui";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(title, padX, 6);
  ctx.textAlign = "right";
  ctx.fillStyle = "#7c5cfc";
  ctx.font = "800 13px ui-sans-serif, system-ui";
  ctx.fillText(Math.round(currentYear).toString(), w - padX, 4);
}

function drawTop10(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, data: DataRow[], title: string) {
  const { years, labels, valueMap } = processData(data);
  const lastYear = years[years.length - 1];
  const rows = labels.map((l, i) => ({
    label: l,
    value: valueMap[l]?.[lastYear] || 0,
    color: COLORS[i % COLORS.length],
  })).sort((a, b) => b.value - a.value).slice(0, 5);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const reveal = Math.floor((t % 1) * (rows.length + 1));
  ctx.fillStyle = TEXT;
  ctx.font = "700 11px ui-sans-serif, system-ui";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(title, 12, 6);
  const padTop = 24;
  const rowH = (h - padTop - 6) / 5;
  rows.forEach((r, i) => {
    const rank = rows.length - i;
    const shown = i >= rows.length - reveal;
    const y = padTop + i * rowH;
    const alpha = shown ? easeInOut(Math.min(1, ((t % 1) * (rows.length + 1)) - (rows.length - i - 1))) : 0;
    if (alpha <= 0) return;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = r.color;
    ctx.fillRect(12, y + 2, 22, rowH - 6);
    ctx.fillStyle = TEXT;
    ctx.font = "800 11px ui-sans-serif, system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("#" + rank, 23, y + (rowH - 4) / 2);
    ctx.textAlign = "left";
    ctx.font = "600 10px ui-sans-serif, system-ui";
    ctx.fillText(r.label, 40, y + (rowH - 4) / 2);
    ctx.fillStyle = SUB;
    ctx.textAlign = "right";
    ctx.fillText(Math.round(r.value).toString(), w - 12, y + (rowH - 4) / 2);
    ctx.globalAlpha = 1;
  });
}

function drawTimeline(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, data: DataRow[], title: string) {
  const { years, labels, valueMap } = processData(data);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const padX = 16, padTop = 24, padBottom = 18;
  const chartH = h - padTop - padBottom;
  const cycle = t % 1;
  const lastYear = years[0] + (years[years.length - 1] - years[0]) * cycle;
  ctx.strokeStyle = "#22222e"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(padX, h - padBottom); ctx.lineTo(w - padX, h - padBottom); ctx.stroke();
  const top = labels.slice(0, 4);
  const maxV = Math.max(...top.flatMap((l) => Object.values(valueMap[l] || {})), 1);
  top.forEach((l, i) => {
    ctx.strokeStyle = COLORS[i % COLORS.length];
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const points: [number, number][] = [];
    const N = 40;
    for (let k = 0; k <= N; k++) {
      const yr = years[0] + (lastYear - years[0]) * (k / N);
      const v = interp(valueMap[l] || {}, years, yr);
      const x = padX + ((yr - years[0]) / (years[years.length - 1] - years[0])) * (w - padX * 2);
      const y = padTop + chartH - (v / maxV) * chartH;
      points.push([x, y]);
    }
    points.forEach(([x, y], k) => k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.stroke();
    const last = points[points.length - 1];
    if (last) {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.beginPath(); ctx.arc(last[0], last[1], 2.5, 0, Math.PI * 2); ctx.fill();
    }
  });
  ctx.fillStyle = TEXT;
  ctx.font = "700 11px ui-sans-serif, system-ui";
  ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(title, padX, 6);
  ctx.fillStyle = "#7c5cfc";
  ctx.font = "800 12px ui-sans-serif, system-ui";
  ctx.textAlign = "right";
  ctx.fillText(Math.round(lastYear).toString(), w - padX, 6);
}

function drawComparison(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, data: DataRow[], title: string) {
  const { years, labels, valueMap } = processData(data);
  const a = labels[0], b = labels[1];
  const cycle = t % 1;
  const yr = years[0] + (years[years.length - 1] - years[0]) * cycle;
  const va = interp(valueMap[a] || {}, years, yr);
  const vb = interp(valueMap[b] || {}, years, yr);
  const max = Math.max(va, vb, 1);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  // left
  const lh = (va / max) * (h - 50);
  ctx.fillStyle = COLORS[0];
  ctx.fillRect(cx - 50, h - 24 - lh, 36, lh);
  // right
  const rh = (vb / max) * (h - 50);
  ctx.fillStyle = COLORS[2];
  ctx.fillRect(cx + 14, h - 24 - rh, 36, rh);
  ctx.fillStyle = TEXT;
  ctx.font = "700 10px ui-sans-serif, system-ui";
  ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(a, cx - 32, h - 18);
  ctx.fillText(b, cx + 32, h - 18);
  ctx.font = "800 11px ui-sans-serif, system-ui";
  ctx.fillText(Math.round(va).toString(), cx - 32, h - 36 - lh);
  ctx.fillText(Math.round(vb).toString(), cx + 32, h - 36 - rh);
  ctx.fillStyle = "#ef4444";
  ctx.font = "900 14px ui-sans-serif, system-ui";
  ctx.fillText("VS", cx, h / 2 - 8);
  ctx.fillStyle = TEXT;
  ctx.font = "700 11px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.fillText(title, 12, 6);
  ctx.fillStyle = "#7c5cfc";
  ctx.font = "800 12px ui-sans-serif, system-ui";
  ctx.textAlign = "right";
  ctx.fillText(Math.round(yr).toString(), w - 12, 6);
}

const DATASETS: Record<LivePreviewMode, DataRow[]> = {
  bar_race: GDP_SAMPLE,
  top10: GDP_SAMPLE,
  timeline: POPULATION_SAMPLE,
  comparison: FOOTBALL_SAMPLE,
};

const DURATIONS: Record<LivePreviewMode, number> = {
  bar_race: 6000,
  top10: 5000,
  timeline: 6000,
  comparison: 5000,
};

const DEFAULT_TITLES: Record<LivePreviewMode, string> = {
  bar_race: "GDP Race",
  top10: "Top 5 Economies",
  timeline: "Population Timeline",
  comparison: "Head-to-Head",
};

export function LivePreview({ mode, className, data: dataOverride, title }: { mode: LivePreviewMode; className?: string; data?: DataRow[]; title?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (active) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(wrap);
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    let start = performance.now();
    const data = dataOverride ?? DATASETS[mode];
    const dur = DURATIONS[mode];
    const titleText = title ?? DEFAULT_TITLES[mode];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.max(160, rect.width * dpr);
      canvas.height = Math.max(96, rect.height * dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.1 },
    );
    io.observe(wrap);

    const tick = (now: number) => {
      if (visible) {
        const t = ((now - start) % dur) / dur;
        const rect = wrap.getBoundingClientRect();
        const w = rect.width, h = rect.height;
        switch (mode) {
          case "bar_race": drawBarRace(ctx, t, w, h, data, titleText); break;
          case "top10": drawTop10(ctx, t, w, h, data, titleText); break;
          case "timeline": drawTimeline(ctx, t, w, h, data, titleText); break;
          case "comparison": drawComparison(ctx, t, w, h, data, titleText); break;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [mode, active, dataOverride, title]);

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: "100%", aspectRatio: "16 / 9", borderRadius: 12, overflow: "hidden", background: BG }}
      aria-hidden
    >
      {active && <canvas ref={canvasRef} />}
    </div>
  );
}

export default LivePreview;