import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

interface Props {
  title: string;
  description: string;
  path: string;
}

const DashboardComingSoon = ({ title, description, path }: Props) => (
  <>
    <Seo title={`${title} — Dashboard`} description={description} path={path} noindex />
    <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground mb-6">{description}</p>
    <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
      <Clock className="w-10 h-10 text-primary mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-foreground mb-2">Coming soon</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
        We're rolling out the creator platform in stages. This section is part of the next release.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold text-sm"
      >
        Back to overview
      </Link>
    </div>
  </>
);

export default DashboardComingSoon;