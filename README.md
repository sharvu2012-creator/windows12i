# Windows 12 Concept

An imaginary Windows 12 desktop that runs entirely in the browser. Plain HTML, CSS and JavaScript, with no build step.

Not affiliated with or endorsed by Microsoft.

## Deploy on Vercel

**Option A: Vercel CLI**
```
npm i -g vercel
cd windows12
vercel --prod
```

**Option B: Dashboard**
1. Push this folder to a GitHub repo.
2. On vercel.com, click Add New, then Project, and import the repo.
3. Framework Preset: Other. Leave the build command and output directory empty.
4. Deploy.

## Features
- Boot animation and lock screen
- Floating centered taskbar, Start menu with search, Widgets panel, Quick settings
- Draggable, resizable windows with minimize, maximize and close
- Apps: Files, Nova Browser, Aura AI, Notes, Calculator, Terminal, Sketch, Settings
- Dark and light themes, 4 wallpapers, 6 accent colors (saved in localStorage)
- Right-click desktop menu
