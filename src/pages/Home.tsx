import { useNavigate } from "react-router-dom";
import { Play, FolderOpen, Layout } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]" style={{ background: "hsl(252 85% 60%)" }} />

      <div className="relative z-10 text-center max-w-md w-full">
        <h1
          className="text-5xl font-extrabold tracking-tight text-foreground opacity-0 animate-fade-in"
          style={{ lineHeight: "1.1" }}
        >
          Data to Video
        </h1>
        <p className="mt-4 text-muted-foreground text-lg opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          Turn your data into viral videos
        </p>

        <div className="mt-12 flex flex-col gap-4 opacity-0 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <button
            onClick={() => navigate("/create")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform duration-150"
          >
            <Play className="w-5 h-5" />
            Create New Video
          </button>

          <button
            onClick={() => navigate("/projects")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base active:scale-[0.97] transition-transform duration-150"
          >
            <FolderOpen className="w-5 h-5" />
            My Projects
          </button>

          <button
            onClick={() => navigate("/templates")}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-secondary text-secondary-foreground font-semibold text-base active:scale-[0.97] transition-transform duration-150"
          >
            <Layout className="w-5 h-5" />
            Templates
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
