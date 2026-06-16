import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  FileText,
  Globe,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  ArrowLeft,
  FolderHeart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/videos", label: "My Videos", icon: Video },
  { to: "/dashboard/collections", label: "Collections", icon: FolderHeart },
  { to: "/dashboard/drafts", label: "Drafts", icon: FileText },
  { to: "/dashboard/published", label: "Published", icon: Globe },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/profile", label: "Profile", icon: UserCircle },
  { to: "/dashboard/account", label: "Account", icon: Settings },
];

export const DashboardLayout = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth?next=/dashboard");
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="min-h-screen" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="md:w-60 md:border-r border-border md:min-h-screen flex md:flex-col bg-card md:bg-background">
        <div className="hidden md:flex items-center gap-2 px-5 py-5 border-b border-border">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto md:overflow-visible">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="hidden md:flex items-center gap-3 mx-3 mt-auto mb-4 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 max-w-5xl w-full mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;