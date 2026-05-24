import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <Seo title="Terms of Service — Data to Video" description="Terms governing your use of Data to Video, our free browser-based data video maker." path="/terms" />
    <SiteHeader />
    <main className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
      <h1 className="text-4xl font-extrabold text-foreground">Terms of Service</h1>
      <div className="mt-6 space-y-4 text-foreground/90 leading-relaxed">
        <p>By using Data to Video you agree to these terms. The service is provided as-is, without warranty.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Acceptable use</h2>
        <p>Don't use the service to create content that is illegal, defamatory or that infringes the rights of others. You are responsible for the data you input and the videos you export.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Content ownership</h2>
        <p>You own the videos you create. We claim no rights to your output.</p>
        <h2 className="text-xl font-bold text-foreground mt-6">Account termination</h2>
        <p>We reserve the right to suspend accounts that violate these terms.</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;