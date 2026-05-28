import { useState } from "react";
import { MessageCircle, X, Send, HelpCircle, Play } from "lucide-react";

const WHATSAPP_NUMBER = "62881010552970";

const messageTemplates = [
  {
    label: "Get support",
    icon: HelpCircle,
    text: "Hi! I need help with Data to Video. Can you assist me?",
  },
  {
    label: "Ask about templates",
    icon: Play,
    text: "Hi! I'd like to know more about the video templates you offer.",
  },
  {
    label: "Custom project",
    icon: Send,
    text: "Hi! I have a custom data video project. Can we discuss it?",
  },
];

export const WhatsAppFloat = () => {
  const [open, setOpen] = useState(false);

  const openWhatsApp = (text: string) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="animate-fade-in mb-1 w-72 rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
          <div className="bg-[#25D366] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Data to Video Support</p>
                <p className="text-xs text-white/80">Typically replies in minutes</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need help? Choose a quick start message or type your own:
            </p>

            <div className="space-y-2">
              {messageTemplates.map((t) => (
                <button
                  key={t.label}
                  onClick={() => openWhatsApp(t.text)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-left text-sm text-foreground transition-colors group"
                >
                  <t.icon className="w-4 h-4 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-border">
              <button
                onClick={() => openWhatsApp("Hi! I have a question about Data to Video.")}
                className="w-full text-center text-sm text-[#25D366] hover:underline py-1"
              >
                Start a custom conversation
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-all duration-300 flex items-center justify-center"
        aria-label={open ? "Close WhatsApp chat" : "Open WhatsApp chat"}
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
      </button>
    </div>
  );
};
