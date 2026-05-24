import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { Mail } from "lucide-react";

const Contact = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Contact — Data to Video" description="Get in touch with the Data to Video team for support, feedback or partnership inquiries." path="/contact" />
    <SiteHeader />
    <main className="flex-1 max-w-2xl mx-auto px-6 py-12 w-full">
      <h1 className="text-4xl font-extrabold text-foreground">Contact</h1>
      <p className="mt-4 text-muted-foreground">Questions, feedback or partnership ideas? We'd love to hear from you.</p>
      <a href="mailto:hello@data-to-video.app" className="mt-8 inline-flex items-center gap-3 bg-card rounded-xl p-5 hover:bg-card/70 transition-colors">
        <Mail className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground">hello@data-to-video.app</span>
      </a>
    </main>
    <Footer />
  </div>
);

export default Contact;