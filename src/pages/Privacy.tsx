import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const Privacy = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Privacy Policy — Data to Video" description="How Data to Video handles your data: local-first rendering, no tracking of CSV contents, GDPR-friendly." path="/privacy" />
    <SiteHeader />
    <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-4xl font-extrabold text-foreground">Privacy Policy</h1>
      <div className="mt-6 space-y-4 text-foreground/90 leading-relaxed">
        <p>Data to Video is a local-first application. CSV files, manual data entries and rendered videos stay in your browser — they are never uploaded to our servers.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Account data</h2>
        <p>If you sign in, we store your email, plan tier and projects you choose to save. We do not sell or share this data.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Analytics</h2>
        <p>We use privacy-respecting analytics to count page views. No personal data is collected.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Contact</h2>
        <p>Privacy questions: hello@data-to-video.app</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;