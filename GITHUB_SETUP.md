# 📤 GitHub Setup Guide

Follow these steps to publish your Magic Fruit Plinko game to GitHub and share it with friends!

## Step 1: Create a GitHub Repository

1. Go to [GitHub.com](https://github.com)
2. Click the **+** icon (top right) → **New repository**
3. Repository name: `magic-fruit-plinko`
4. Description: "An interactive arcade-style Plinko game built with Matter.js"
5. Choose **Public** (so friends can see it)
6. **Do NOT** initialize with README/LICENSE (we have these already)
7. Click **Create repository**

## Step 2: Push to GitHub

Copy the commands from your GitHub repository page (it will show something like this):

```bash
cd "c:\Users\arnel\Documents\codes\MAGIC FRUIT"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/magic-fruit-plinko.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy to GitHub Pages (Free Hosting!)

### Option A: Using GitHub Pages (Recommended)

1. Go to your repository on GitHub
2. Click **Settings** (top right)
3. Scroll down to **Pages** (left sidebar)
4. Under "Build and deployment":
   - Source: Select **GitHub Actions**
5. Create a workflow file:
   - Click **.github** folder
   - Create **workflows** folder
   - Create **deploy.yml` file

Add this content to `deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './dist'
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v1
```

6. Commit this file
7. Wait for the GitHub Actions workflow to complete (you'll see a checkmark)
8. Your game is live at: `https://YOUR_USERNAME.github.io/magic-fruit-plinko`

### Option B: Build Locally & Deploy

```bash
# Build the game
npm run build

# Create/update gh-pages branch
git add dist -f
git commit -m "Deploy to GitHub Pages"
git push origin main
```

Then enable GitHub Pages in repository Settings (set source to main branch, deploy from /dist folder).

## Step 4: Share with Friends!

Send them the link:
```
https://YOUR_USERNAME.github.io/magic-fruit-plinko
```

## 🎮 Playing the Game Online

Once deployed, friends can:
1. Visit your GitHub Pages URL
2. Click **LEFT/RIGHT** buttons to drop coins
3. Try to complete rows and maximize their cashouts
4. No installation needed - plays directly in the browser!

## 📋 Your Repository Features

Your repository will have:
- ✅ Complete source code
- ✅ Beautiful README with instructions
- ✅ MIT License
- ✅ .gitignore for clean commits
- ✅ package.json with dependencies
- ✅ Live playable game on GitHub Pages

## 🔗 Adding to Your Portfolio

When showing this to friends or adding to your portfolio, you can reference:
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/magic-fruit-plinko`
- **Live Demo**: `https://YOUR_USERNAME.github.io/magic-fruit-plinko`

## 🚀 Updates & Improvements

Want to add more features? Just commit and push:

```bash
# Make changes to your code...

git add .
git commit -m "Add new feature: [description]"
git push origin main
```

GitHub Pages will automatically redeploy your updated game!

## ❓ Troubleshooting

### "Build failed" in GitHub Actions
- Check that `npm run build` works locally: `npm run build`
- Verify all dependencies are in `package.json`

### Game doesn't work after deployment
- Make sure your `index.html` uses correct paths (use `/src/` not `./src/`)
- Check browser console for errors (F12 → Console tab)

### Can't push to GitHub
- Make sure you have Git installed and configured
- Use HTTPS clone URL (not SSH) if you haven't set up SSH keys
- Verify your GitHub credentials

---

**Questions?** Check GitHub's [Pages documentation](https://docs.github.com/en/pages)

**Enjoy sharing your game! 🎉**
