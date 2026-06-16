import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import Home from "./pages/Home";
import Create from "./pages/Create";
import Projects from "./pages/Projects";
import Templates from "./pages/Templates";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { WhatsAppFloat } from "./components/WhatsAppFloat";
const TemplateLanding = lazy(() => import("./pages/TemplateLanding"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Watch = lazy(() => import("./pages/Watch"));
const Datasets = lazy(() => import("./pages/Datasets"));
const DatasetPage = lazy(() => import("./pages/DatasetPage"));
const Tools = lazy(() => import("./pages/Tools"));
const ToolPage = lazy(() => import("./pages/ToolPage"));
const Community = lazy(() => import("./pages/Community"));
const CommunityProject = lazy(() => import("./pages/CommunityProject"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardProfile = lazy(() => import("./pages/DashboardProfile"));
const DashboardComingSoon = lazy(() => import("./pages/DashboardComingSoon"));
const DashboardLayout = lazy(() => import("./components/DashboardLayout"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const TagPage = lazy(() => import("./pages/TagPage"));
const CollectionPage = lazy(() => import("./pages/CollectionPage"));
const DashboardVideos = lazy(() => import("./pages/DashboardVideos"));
const DashboardCollections = lazy(() => import("./pages/DashboardCollections"));
import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/:slug" element={<TemplateLanding />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/watch/:slug" element={<Watch />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/datasets/:slug" element={<DatasetPage />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/:slug" element={<ToolPage />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityProject />} />
          <Route path="/tag/:slug" element={<TagPage />} />
          <Route path="/u/:username" element={<UserProfile />} />
          <Route path="/u/:username/c/:slug" element={<CollectionPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<DashboardProfile />} />
            <Route path="videos" element={<DashboardVideos />} />
            <Route path="collections" element={<DashboardCollections />} />
            <Route
              path="drafts"
              element={<DashboardComingSoon title="Drafts" description="Unfinished projects you can return to." path="/dashboard/drafts" />}
            />
            <Route
              path="published"
              element={<DashboardComingSoon title="Published Videos" description="Manage your public community videos." path="/dashboard/published" />}
            />
            <Route
              path="analytics"
              element={<DashboardComingSoon title="Analytics" description="Views, likes, and traffic over time." path="/dashboard/analytics" />}
            />
            <Route
              path="account"
              element={<DashboardComingSoon title="Account Settings" description="Email, password, export and delete your account." path="/dashboard/account" />}
            />
          </Route>
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        <WhatsAppFloat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
