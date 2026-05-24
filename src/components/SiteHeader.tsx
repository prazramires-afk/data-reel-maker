import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface Props {
  back?: boolean;
}

export const SiteHeader = ({ back }: Props) => {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between">
        {back ? (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <Link to="/" className="font-bold text-foreground">Data to Video</Link>
        )}
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/templates" className="hover:text-foreground hidden sm:inline">Templates</Link>
          <Link to="/blog" className="hover:text-foreground hidden sm:inline">Blog</Link>
          <Link to="/create" className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
};