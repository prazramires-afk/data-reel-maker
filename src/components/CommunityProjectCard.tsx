import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Project, DataRow } from "@/lib/types";
import { formatValue } from "@/lib/valueFormat";

const COLORS = ["#7c5cfc", "#3b9dff", "#f97316", "#22c55e", "#ef4444", "#eab308"];
const BG = "#0f0f17";
const TEXT = "#f0f0f5";
const SUB = "#8888a0";

function process(data: DataRow[]) {
  const yearsSet = new Set<number>();
  const labelsSet = new Set<string>();
  const vm: Record<string, Record<number, number>> = {};
  data.forEach((r) => {
    yearsSet.add(r.year);
    labelsSet.add(r.label);
    (vm[r.label] ||= {})[r.year] = r.value;
  });
  return { years: [...yearsSet].sort((a, b) => a - b), labels: [...labelsSet], vm };
}

function interp(vm: Record<number, number>, years: number[], y: number) {
  if (vm[y] !== undefined) return vm[y];
  let lo = years[0], hi = years[years.length - 1];
  for (const yr of years) { if (yr <= y) lo = yr; if (yr >= y && hi === years[years.length - 1]) hi = yr; }
  if (lo === hi) return vm[lo] || 0;
  const t = (y - lo) / (hi - lo);
  return (vm[lo] || 0) + ((vm[hi] || 0) - (vm[lo] || 0)) * t;
}

function draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, project: Project) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  const data = project.data || [];
  if (!data.length) return;
  const { years, labels, vm } = process(data);
  const cycle = t % 1;
  const cy = years[0] + (years[years.length - 1] - years[0]) * cycle;
  const labelColors = project.settings?.labelColors ?? {};
  const rows = labels
    .map((l, i) => ({ label: l, value: interp(vm[l] || {}, years, cy), color: labelColors[l] || COLORS[i % COLORS.length] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const max = Math.max(...rows.map((r) => r.value), 1);
  const padX = 10, padTop = 22, padBottom = 14;
  const rowH = (h - padTop - padBottom) / rows.length;
  rows.forEach((r, i) => {
    const y = padTop + i * rowH + 2;
    const bw = ((w - padX * 2 - 56) * r.value) / max;
    ctx.fillStyle = r.color;
    ctx.fillRect(padX + 48, y, Math.max(2, bw), rowH - 6);
    ctx.fillStyle = TEXT;
    ctx.font = "600 9px ui-sans-serif, system-ui";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(r.label.slice(0, 12), padX + 44, y + (rowH - 6) / 2);
    ctx.textAlign = "left";
    ctx.fillStyle = SUB;
    ctx.fillText(formatValue(r.value, project.settings?.valueFormat), padX + 52 + bw, y + (rowH - 6) / 2);
  });
  ctx.fillStyle = TEXT;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const fullTitle = project.settings?.title || project.name || "";
  const yearW = 32;
  const maxTitleW = w - padX * 2 - yearW;
  let fontSize = 10;
  ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
  while (fontSize > 6 && ctx.measureText(fullTitle).width > maxTitleW) {
    fontSize -= 0.5;
    ctx.font = `700 ${fontSize}px ui-sans-serif, system-ui`;
  }
  let drawTitle = fullTitle;
  if (ctx.measureText(drawTitle).width > maxTitleW) {
    while (drawTitle.length > 1 && ctx.measureText(drawTitle + "…").width > maxTitleW) {
      drawTitle = drawTitle.slice(0, -1);
    }
    drawTitle += "…";
  }
  ctx.fillText(drawTitle, padX, 6);
  ctx.textAlign = "right";
  ctx.fillStyle = "#7c5cfc";
  ctx.font = "800 12px ui-sans-serif, system-ui";
  ctx.fillText(Math.round(cy).toString(), w - padX, 4);
}

export function CommunityProjectCard({ project }: { project: Project }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || active) return;
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
    let pausedAt = 0;
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
    const io = new IntersectionObserver((e) => {
      const next = e[0]?.isIntersecting ?? true;
      if (next === visible) return;
      visible = next;
      if (visible) {
        start += performance.now() - pausedAt;
        if (!raf) raf = requestAnimationFrame(tick);
      } else {
        pausedAt = performance.now();
        if (raf) { cancelAnimationFrame(raf); raf = 0; }
      }
    }, { threshold: 0.01 });
    io.observe(wrap);
    const tick = (now: number) => {
      if (!visible) { raf = 0; return; }
      const rect = wrap.getBoundingClientRect();
      draw(ctx, ((now - start) % 6000) / 6000, rect.width, rect.height, project);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [project, active]);

  return (
    <Link
      to={`/community/${project.slug || project.id}`}
      className="block bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors"
    >
      <div ref={wrapRef} style={{ width: "100%", aspectRatio: "16 / 9", background: BG }} aria-hidden>
        {active && <canvas ref={canvasRef} />}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-foreground truncate">{project.settings?.title || project.name || "Untitled"}</h3>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {project.authorName ? `by ${project.authorName}` : "by a community creator"}
          {project.publishedAt ? ` · ${new Date(project.publishedAt).toLocaleDateString()}` : ""}
        </p>
      </div>
    </Link>
  );
}

export default CommunityProjectCard;