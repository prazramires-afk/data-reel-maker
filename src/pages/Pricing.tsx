import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    tagline: "Start making data videos today.",
    features: [
      "All 4 video types: Bar Chart Race, Timeline Story, Top 10 Countdown, Comparison Battle",
      "CSV import & sample datasets",
      "HD 1080p MP4 export at 60 FPS",
      "Procedural music & sound mixing",
      "Vertical, square & landscape formats",
      "Data to Video watermark",
    ],
    cta: "Start creating",
    href: "/create?new=1",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    tagline: "For creators who publish daily.",
    features: [
      "Everything in Free",
      "No watermark on exports",
      "4K MP4 export",
      "Custom brand colors & fonts",
      "Priority rendering queue",
      "Early access to new video types",
      "Commercial use license",
    ],
    cta: "Go Pro",
    href: "/create?new=1",
    highlight: true,
  },
];

const Pricing = () => (
  <div className="min-h-screen flex flex-col">
    <Seo
      title="Pricing — Data to Video"
      description="Simple pricing for turning CSVs and rankings into viral videos. Free forever plan; Pro removes the watermark and unlocks 4K exports."
      path="/pricing"
    />
    <SiteHeader />
    <main className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground">Simple, creator-friendly pricing</h1>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          Turn statistics, CSVs and rankings into cinematic videos for TikTok, Reels and Shorts. Start free — upgrade when you need watermark-free 4K exports.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-8 flex flex-col ${
              plan.highlight
                ? "border-primary bg-card shadow-lg shadow-primary/10 relative"
                : "border-border bg-card/40"
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Most popular
              </span>
            )}
            <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
              <span className="text-sm text-muted-foreground">{plan.period}</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-foreground/90">
                  <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={plan.href}
              className={`mt-8 block text-center px-5 py-2.5 rounded-full font-semibold text-sm transition ${
                plan.highlight
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border text-foreground hover:bg-card"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground max-w-md mx-auto">
        Payments are handled securely by Paddle, our merchant of record — taxes, VAT and receipts are taken care of automatically. Cancel anytime.
      </p>
    </main>
    <Footer />
  </div>
);

export default Pricing;
