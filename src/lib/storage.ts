import { Project } from "./types";
import { supabase } from "@/integrations/supabase/client";

const PROJECTS_KEY = "dtv_projects";

function getLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProject(project: Project): void {
  const projects = getLocalProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    projects.push(project);
  }
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    // Storage full — trim oldest projects and retry
    console.warn("Storage quota exceeded, trimming old projects");
    const trimmed = projects.slice(-5);
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(trimmed));
    } catch {
      // Still full — clear and save only current
      localStorage.removeItem(PROJECTS_KEY);
      try {
        localStorage.setItem(PROJECTS_KEY, JSON.stringify([project]));
      } catch {
        console.error("Cannot save to localStorage");
      }
    }
  }
}

function deleteLocalProject(id: string): void {
  const projects = getLocalProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function rowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    data: r.data ?? [],
    settings: r.settings ?? {},
    labelImages: r.label_images ?? {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    isPublic: r.is_public ?? false,
    publishedAt: r.published_at ?? null,
    authorName: r.author_name ?? null,
  };
}

/** Fetch projects for the current user (or all if admin via RLS). Falls back to localStorage when signed out. */
export async function getProjects(): Promise<Project[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return getLocalProjects();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("getProjects error", error);
    return getLocalProjects();
  }
  return (data ?? []).map(rowToProject);
}

export async function saveProject(project: Project): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    saveLocalProject(project);
    return true;
  }
  const payload = {
    id: project.id,
    user_id: user.id,
    name: project.name || "Untitled",
    type: project.type,
    data: project.data as any,
    settings: project.settings as any,
    label_images: project.labelImages as any,
  };
  const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("saveProject error", error);
    saveLocalProject(project);
    return false;
  }
  return true;
}

export async function deleteProject(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    deleteLocalProject(id);
    return;
  }
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) console.error("deleteProject error", error);
}

/** Admin-only: fetch a single project by id (RLS allows admins). */
export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToProject(data);
}

/** Admin-only: fetch all projects belonging to a target user. */
export async function getProjectsByUser(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(rowToProject);
}

/** Toggle whether a project is visible to the community. */
export async function setProjectPublic(
  id: string,
  isPublic: boolean,
  authorName?: string,
): Promise<boolean> {
  const patch = {
    is_public: isPublic,
    published_at: isPublic ? new Date().toISOString() : null,
    ...(isPublic && authorName ? { author_name: authorName.slice(0, 60) } : {}),
  };
  const { error } = await supabase.from("projects").update(patch as any).eq("id", id);
  if (error) {
    console.error("setProjectPublic error", error);
    return false;
  }
  return true;
}

/** Public — fetch most recently published community projects. */
export async function getCommunityProjects(limit = 12): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("is_public", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("getCommunityProjects error", error);
    return [];
  }
  return (data ?? []).map(rowToProject);
}
