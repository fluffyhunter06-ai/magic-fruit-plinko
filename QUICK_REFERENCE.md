# 🚀 Quick Reference Guide

## Start the Game

### Windows

```bash
start.bat
```

### Mac/Linux

```bash
./start.sh
```

### Manual (Any OS)

```bash
npm install   # Only needed once
npm run dev   # Start server
```

Then open: **http://localhost:5173**

---

## Build for Production

```bash
npm run build
```

Creates optimized files in `dist/` folder ready for deployment.

---

## GitHub Publishing Steps

```bash
# 1. Create new repo on GitHub named "magic-fruit-plinko"

# 2. Add remote and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/magic-fruit-plinko.git
git push -u origin main

# 3. Enable GitHub Pages
# Go to repo Settings > Pages > Deploy from main branch
# or use GitHub Actions (see GITHUB_SETUP.md)

# 4. Share the link!
# https://YOUR_USERNAME.github.io/magic-fruit-plinko
```

---

## Game Controls

| Control            | Action                  |
| ------------------ | ----------------------- |
| **LEFT Button**    | Drop coin from left     |
| **RIGHT Button**   | Drop coin from right    |
| **CASHOUT Button** | Cash out completed rows |
| **Helper ON/OFF**  | Toggle position display |

---

## Key Game Info

| Property       | Value              |
| -------------- | ------------------ |
| Starting Coins | 50                 |
| Cost per Drop  | 1 coin             |
| Drop Cooldown  | 0.75 seconds       |
| Max Rows       | 6                  |
| Max Payout     | 200 coins (Trophy) |

---

## Files Overview

| File                | Purpose                 |
| ------------------- | ----------------------- |
| `index.html`        | Main game page          |
| `src/game.js`       | Game engine & logic     |
| `src/main.js`       | Entry point             |
| `src/style.css`     | Game styling            |
| `package.json`      | Dependencies            |
| `README.md`         | Full documentation      |
| `GITHUB_SETUP.md`   | GitHub deployment guide |
| `SETUP_COMPLETE.md` | Detailed setup info     |

---

## Useful Commands

```bash
# Development
npm run dev          # Start dev server with auto-reload

# Production
npm run build        # Create optimized build
npm run preview      # Preview production build locally

# Git
git status          # Check current changes
git add .           # Stage all changes
git commit -m "msg" # Commit changes
git push            # Push to GitHub
git log             # View commit history
```

---

## Share With Friends

Just give them this link:

```
https://YOUR_USERNAME.github.io/magic-fruit-plinko
```

No installation needed - plays directly in browser! 🎮

---

## Troubleshooting

**Port 5173 already in use?**

```bash
npm run dev -- --port 3000
```

**Want to update later?**

```bash
# Make changes
git add .
git commit -m "Description of changes"
git push
# GitHub Pages auto-updates in ~1 minute
```

**Need to reinstall dependencies?**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## File Size Reference

After `npm run build`:

- **index.html**: ~1.5 KB
- **JavaScript bundle**: ~200-300 KB (with Matter.js)
- **Total**: ~350-400 KB (includes all dependencies)

---

## Browser Compatibility

Works on:

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

Requires WebGL for best performance.

---

## Development Tips

1. **Fast refresh**: Changes auto-reload in browser
2. **Inspect elements**: Press F12 to open DevTools
3. **Test on mobile**: Use `npm run dev` and visit from phone
4. **Check performance**: Profile in DevTools > Performance tab

---

**Get help**: Read README.md or GITHUB_SETUP.md

**Enjoy your game! 🍒🎉**
