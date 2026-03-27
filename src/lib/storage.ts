import { Project } from "./types";

const PROJECTS_KEY = "dtv_projects";

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(project: Project): void {
  const projects = getProjects();
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

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}
