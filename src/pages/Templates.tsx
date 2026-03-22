import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TEMPLATES } from "@/lib/templates";

const Templates = () => {
  const navigate = useNavigate();

  const handleSelect = (templateId: string) => {
    navigate(`/create?template=${templateId}`);
  };

  return (
    <div className="min-h-screen px-5 py-6 max-w-lg mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground mb-6 active:scale-95 transition-transform">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2">Templates</h1>
      <p className="text-muted-foreground mb-6">Pre-built data and styles — ready to customize</p>

      <div className="flex flex-col gap-3">
        {TEMPLATES.map((tpl, i) => (
          <button
            key={tpl.id}
            onClick={() => handleSelect(tpl.id)}
            className="bg-card rounded-xl p-5 text-left active:scale-[0.97] transition-transform opacity-0 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">{tpl.icon}</span>
              <div>
                <h3 className="font-bold text-foreground text-lg">{tpl.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tpl.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Templates;
