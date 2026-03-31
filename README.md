# NBA Draft HQ

A comprehensive NBA Draft scouting platform with big board rankings, mock draft simulator, and detailed prospect profiles.

## Features

- **Top 25 Big Board** - Complete rankings with detailed prospect data
- **4 View Modes** - Snapshot, Summary, Report, and Full Profile for each prospect
- **Mock Draft** - Admin-controlled mock draft with all 30 teams
- **Team Needs** - Real draft order with position needs for each team
- **Persistent Storage** - Mock draft picks save to localStorage

## Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nba-draft-hq.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Click "Deploy"

That's it! Vercel will automatically build and deploy your site.

### Admin Access

To edit the mock draft:
1. Go to the Mock Draft page
2. Click "Admin" in the top right
3. Enter key: `draft-hq-admin-2026`
4. Now you can add/change/clear picks

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build for Production

```bash
npm run build
```

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Local Storage for data persistence
