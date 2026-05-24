import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const About = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="About — Data to Video" description="Data to Video is a free creator-first tool for turning statistics, CSVs and rankings into viral TikTok and Reels videos." path="/about" />
    <SiteHeader />
    <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-4xl font-extrabold text-foreground">About Data to Video</h1>
      <div className="mt-6 space-y-5 text-foreground/90 leading-relaxed">
        <p>Data to Video is a free, browser-based tool that helps creators turn raw data into viral short-form videos. We started it because the format works — bar chart races, top 10 countdowns and animated comparisons rack up billions of views every month — but the existing tools were either desktop-only, expensive, or required code.</p>
        <p>Everything runs locally in your browser. Your data never touches our servers. We export vertical MP4s sized for TikTok, Reels and YouTube Shorts.</p>
        <p>Built for creators, educators, finance pages, sports channels and anyone who wants to make data move.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default About;