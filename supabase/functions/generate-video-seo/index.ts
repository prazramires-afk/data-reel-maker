// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const CATEGORIES = [
  "economy",
  "finance",
  "population",
  "sports",
  "technology",
  "entertainment",
  "other",
] as const;

function buildDatasetDigest(project: any): string {
  const rows: Array<{ label: string; value: number; year: number }> =
    Array.isArray(project?.data) ? project.data : [];
  if (!rows.length) return "(no rows)";
  const labels = Array.from(new Set(rows.map((r) => r.label)));
  const years = Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => a - b);
  const latest = years[years.length - 1];
  const earliest = years[0];
  const latestRows = rows
    .filter((r) => r.year === latest)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
  const earliestRows = rows.filter((r) => r.year === earliest);
  const lines: string[] = [];
  lines.push(`Title: ${project?.settings?.title || project?.name || ""}`);
  lines.push(`Type: ${project?.type}`);
  lines.push(`Labels (${labels.length}): ${labels.slice(0, 25).join(", ")}`);
  lines.push(`Years: ${earliest} → ${latest} (${years.length})`);
  const fmt = project?.settings?.valueFormat ?? {};
  if (fmt.prefix || fmt.suffix || fmt.unit) {
    lines.push(`Unit/format: prefix="${fmt.prefix ?? ""}" suffix="${fmt.suffix ?? ""}" unit="${fmt.unit ?? ""}"`);
  }
  lines.push(`Top in ${latest}:`);
  for (const r of latestRows) lines.push(`  ${r.label}: ${r.value}`);
  if (earliest !== latest) {
    lines.push(`Same labels in ${earliest}:`);
    for (const r of earliestRows.slice(0, 10)) lines.push(`  ${r.label}: ${r.value}`);
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { project_id } = await req.json();
    if (!project_id || typeof project_id !== "string") {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    // Identify caller (optional — anonymous regeneration is also acceptable for already-public videos)
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const callerId = userData?.user?.id ?? null;

    const admin = createClient(url, serviceKey);
    const { data: project, error: fetchErr } = await admin
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .maybeSingle();
    if (fetchErr || !project) {
      return new Response(JSON.stringify({ error: "project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!project.is_public && project.user_id !== callerId) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const digest = buildDatasetDigest(project);
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tool = {
      type: "function",
      function: {
        name: "write_seo_content",
        description: "Write SEO content for a data video page",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            seo_title: { type: "string", maxLength: 70 },
            meta_description: { type: "string", maxLength: 160 },
            summary: { type: "string", description: "2-3 paragraphs introducing the topic and dataset, grounded in real values." },
            insights: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: { type: "string" },
              description: "Bullet-point key findings using real numbers from the digest.",
            },
            faqs: {
              type: "array",
              minItems: 4,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  q: { type: "string" },
                  a: { type: "string" },
                },
                required: ["q", "a"],
              },
            },
            category: { type: "string", enum: [...CATEGORIES] },
          },
          required: ["seo_title", "meta_description", "summary", "insights", "faqs", "category"],
        },
      },
    };

    const systemPrompt = `You write SEO content for short-form data videos. Use the dataset digest. Do not invent numbers — only cite values present in the digest. Tone: clear, informative, journalistic. No emojis. No marketing fluff.`;
    const userPrompt = `Dataset digest:\n${digest}\n\nWrite SEO content for this video's article page. The audience is searching for the topic itself (e.g. "GDP per capita ASEAN"), not the tool. The summary must read like an informative article intro. FAQs must be topic-specific (not about the tool).`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "write_seo_content" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "credits_exhausted" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error", aiResp.status, txt);
      return new Response(JSON.stringify({ error: "ai_error", detail: txt }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const aiJson = await aiResp.json();
    const call = aiJson?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      return new Response(JSON.stringify({ error: "no_tool_call", raw: aiJson }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: any;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch (e) {
      return new Response(JSON.stringify({ error: "bad_json", detail: String(e) }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cat = CATEGORIES.includes(parsed.category) ? parsed.category : "other";
    const update = {
      seo_title: String(parsed.seo_title || "").slice(0, 70),
      meta_description: String(parsed.meta_description || "").slice(0, 160),
      summary: String(parsed.summary || ""),
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 6).map((s: any) => String(s)) : [],
      faqs: Array.isArray(parsed.faqs)
        ? parsed.faqs.slice(0, 6).map((f: any) => ({ q: String(f.q || ""), a: String(f.a || "") })).filter((f: any) => f.q && f.a)
        : [],
      category: cat,
      seo_generated_at: new Date().toISOString(),
    };

    const { error: updErr } = await admin
      .from("projects")
      .update(update)
      .eq("id", project_id);
    if (updErr) {
      console.error("update error", updErr);
      return new Response(JSON.stringify({ error: "db_update_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, ...update }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-video-seo crash", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});