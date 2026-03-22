
# Data to Video — Mobile Web App

## Overview
A mobile-first web app that converts structured data into animated bar chart race videos (TikTok/Reels style). Dark mode default, clean modern UI, canvas-based animation, localStorage persistence.

## Pages & Navigation

### 1. Home Screen
- App title "Data to Video" with subtitle
- Three main action buttons: Create New Video, My Projects, Templates
- Dark gradient background, bold typography

### 2. Create Project Flow (Multi-step wizard)
- **Step 1 — Select Video Type**: Grid of 4 cards (Bar Chart Race active, others marked "Coming Soon")
- **Step 2 — Input Data**: Three tabs (Manual Table, Paste CSV, Sample Data). Manual table with add/remove rows, CSV textarea, and 3 quick-load sample buttons
- **Step 3 — Customize**: Title input, duration selector, theme picker (Dark/Light/Neon), toggle switches for labels/values, animation speed selector
- **Step 4 — Preview**: Full-width canvas with animated bar chart race. Play/Restart controls. Bars dynamically sort and animate with smooth interpolation
- **Step 5 — Export**: Simulated render progress bar, then Download MP4 + Share buttons

### 3. My Projects
- List of saved projects from localStorage with title, type, last edited date
- Edit and Delete actions per card

### 4. Templates
- 4 pre-built templates (Viral Bar Race, Educational Timeline, Sports Battle, Economic Growth)
- Each loads pre-configured data and settings into the create flow

## Canvas Animation (Bar Chart Race)
- HTML5 Canvas rendering with requestAnimationFrame
- Interpolate values between data points over time
- Dynamic sorting — bars reorder smoothly as values change
- Color-coded bars with labels and values
- "Made with Data to Video" watermark overlay
- Viral hook text animation at video start

## Data & Storage
- All projects saved to localStorage with JSON structure
- User settings persistence
- No backend needed

## Technical Approach
- React + TypeScript + Tailwind CSS
- React Router for page navigation
- Canvas API for animation rendering
- localStorage for data persistence
- Mobile-first responsive design, dark mode default
- Capacitor-compatible structure

## UI Style
- Dark background with subtle gradients
- Rounded cards with soft shadows
- Bold sans-serif typography
- Accent colors (vibrant blue/purple for CTAs)
- Bottom navigation or step indicators in wizard
