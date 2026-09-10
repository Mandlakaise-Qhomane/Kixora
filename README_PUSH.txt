KIXORA — Phase 1 pack (ready to copy onto your clone and push)

HOW TO PUSH
-----------
1. On your machine:
     git clone https://github.com/Mandlakaise-Qhomane/Kixora.git
     cd Kixora
2. Unzip this archive over the repo (overwrite when asked).
3. Review:
     git status
     git diff
4. Commit and push:
     git add index.html tailwind.config.js src/index.css src/App.tsx \
             src/components/Navbar.tsx src/components/Footer.tsx \
             src/components/MobileNav.tsx public/manifest.json \
             docs/PHASE_1_REPORT.md docs/PRODUCTION_PHASES.md \
             docs/PHASE1_APPLY_AND_DEPLOY.md README_PUSH.txt
     git commit -m "feat(ui): Phase 1 design-system lock to KIXORA brand board"
     git push origin main

   Prefer a branch:
     git checkout -b phase-1-design-system
     git push -u origin phase-1-design-system

CHANGED / ADDED PATHS (all repo-root relative)
----------------------------------------------
  index.html
  tailwind.config.js
  src/index.css
  src/App.tsx
  src/components/Navbar.tsx
  src/components/Footer.tsx
  src/components/MobileNav.tsx          (NEW)
  public/manifest.json                  (NEW)
  docs/PHASE_1_REPORT.md                (NEW)
  docs/PRODUCTION_PHASES.md             (NEW)
  docs/PHASE1_APPLY_AND_DEPLOY.md       (NEW)
  README_PUSH.txt                       (NEW)

This pack is the design-system lock only. It does not turn on live payments,
Supabase catalog, 3D WebGL, or production secrets. See the deploy report.
