import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const RefundPolicy = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Refund Policy — Data to Video" description="Data to Video refund policy: how to request a refund for your Pro subscription, eligibility and processing times." path="/refund-policy" />
    <SiteHeader />
    <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-4xl font-extrabold text-foreground">Refund Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: September 2026</p>
      <div className="mt-6 space-y-4 text-foreground/90 leading-relaxed">
        <h2 className="text-xl font-bold text-foreground mt-6">Subscriptions</h2>
        <p>You can cancel your Pro subscription at any time. Cancellation takes effect at the end of the current billing period, and you keep Pro access until then.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Refund eligibility</h2>
        <p>We offer a full refund within 14 days of your first purchase if you are not satisfied. For renewal payments, refunds are considered case-by-case when the service was not usable due to a technical issue on our side.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">How to request a refund</h2>
        <p>Email hello@data-to-video.app from the address linked to your account, including your purchase date and receipt. Refunds are processed by Paddle, our merchant of record, and typically appear on your statement within 5–10 business days.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Free plan</h2>
        <p>The Free plan involves no payment, so no refunds apply.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Contact</h2>
        <p>Refund questions: hello@data-to-video.app</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default RefundPolicy;
