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
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
