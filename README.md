# WeatherLive — Deployment Guide

## What Changed (Optimizations Summary)

### Backend
| Issue | Fix |
|---|---|
| **Data leakage** | `MaxT` was both feature & target — removed from features, now uses `MinT, RH1, RH2, Wind` |
| **No model caching** | `joblib` disk cache — models train once, load instantly on every restart |
| **Random Forest slow** | `n_estimators` reduced 100→50, `n_jobs=-1` for parallel CPU training |
| **No gunicorn** | Added to `requirements.txt` — required for Render production |
| **No health endpoint** | Added `GET /api/health` — Render uses this to confirm service is alive |

### Frontend
| Issue | Fix |
|---|---|
| **Infinite re-render** | `cities` array moved outside component (was inside, caused `useEffect` loop) |
| **Wrong field labels** | Form now correctly maps `MinT, RH1, RH2, Wind` with proper units & hints |
| **No navbar** | New `Navbar.js` — sticky glassmorphism nav with active-route highlight + mobile hamburger |
| **No loading states** | Skeleton cards on Weather page; spinner on predict button |
| **No weather icons** | `getWeatherIcon()` maps descriptions → SVG/unicode symbols |
| **Inconsistent styles** | Unified dark design system via CSS variables in `index.css` |
| **No error handling UI** | Inline error banners with icons instead of bare `alert()` |

---

## Redeployment Steps

### ─── BACKEND on Render ───────────────────────────────────

**1. Push backend changes to GitHub**
```bash
# From your project root
git add backend/
git commit -m "feat: joblib caching, health endpoint, data-leakage fix, gunicorn"
git push origin main
```

**2. Open Render dashboard → your backend service**
Go to: https://dashboard.render.com

**3. Set the Start Command**
In your service → Settings → Build & Deploy:
```
Start Command: gunicorn app:app
```
> If you were previously using `python app.py`, change it to `gunicorn app:app`

**4. Verify environment variables**
Settings → Environment → confirm `PORT` is not hardcoded (Render injects it automatically).

**5. Trigger a manual deploy**
Click **"Manual Deploy" → "Deploy latest commit"**

**6. Check the logs**
You should see:
```
No cache found — training models (one-time)...
  ✓ Trained: Linear Regression
  ✓ Trained: Decision Tree
  ✓ Trained: Random Forest
  ✓ Trained: Support Vector Regressor
  ★ Best model: <name> (cached to models_cache.joblib)
```
On the next restart it will say:
```
Loading cached models from disk...
```
This means cold-start time drops from ~60s to ~3s.

**7. Confirm health endpoint is live**
Visit: `https://your-render-url.onrender.com/api/health`
Expected response:
```json
{ "status": "ok", "best_model": "Random Forest", "features": ["MinT","RH1","RH2","Wind"] }
```

---

### ─── FRONTEND on Netlify ────────────────────────────────

**1. Update your backend URL env var**
In your frontend repo, create/update `.env` (do NOT commit this file):
```
REACT_APP_OPENWEATHER_API_KEY=your_openweather_key_here
REACT_APP_BACKEND_URL=https://your-render-url.onrender.com
```

**2. Push frontend changes to GitHub**
```bash
git add frontend/
git commit -m "feat: new navbar, dark UI system, skeleton loaders, bug fixes"
git push origin main
```

**3. Open Netlify dashboard → your site**
Go to: https://app.netlify.com

**4. Set environment variables in Netlify**
Site → Site Configuration → Environment Variables → Add:
- `REACT_APP_OPENWEATHER_API_KEY` = `your_key`
- `REACT_APP_BACKEND_URL` = `https://your-render-url.onrender.com`

> ⚠️ Never hardcode API keys in source code. Netlify injects them at build time.

**5. Verify build settings**
Site → Build & Deploy → Build settings:
```
Base directory:    frontend
Build command:     npm run build
Publish directory: frontend/build
```

**6. Trigger a deploy**
Deploys tab → "Trigger deploy" → "Deploy site"

**7. Confirm the deploy succeeded**
Check the deploy log for:
```
Build complete ✓
Site is live ✓
```

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000/api/health

# Frontend
cd frontend
npm install
cp .env.example .env   # fill in your keys
npm start
# → http://localhost:3000
```

---

## File Structure (changed files only)

```
Weather_Live_WebApp/
├── backend/
│   ├── app.py                ← CHANGED: caching, health, data-leakage fix
│   └── requirements.txt      ← CHANGED: added gunicorn
└── frontend/
    ├── public/
    │   └── index.html        ← CHANGED: title, Google Fonts
    └── src/
        ├── App.js            ← CHANGED: added Navbar
        ├── index.css         ← CHANGED: CSS variables, dark base
        └── components/
            ├── Navbar.js     ← NEW
            ├── Navbar.css    ← NEW
            ├── WelcomePage.js  ← CHANGED: animated hero
            ├── WelcomePage.css ← CHANGED: full rewrite
            ├── Weather.js      ← CHANGED: bug fix, icons, skeleton
            ├── Weather.css     ← CHANGED: full rewrite
            ├── WeatherPredictor.js ← CHANGED: correct features, results UI
            └── PredictForm.css     ← CHANGED: full rewrite
```
