# WeatherLive — Local Setup Guide

## Prerequisites Checklist

Before starting, make sure you have these installed:

| Tool | Check | Install if missing |
|---|---|---|
| Python 3.9+ | `python --version` | https://python.org/downloads |
| pip | `pip --version` | Comes with Python |
| Node.js 18+ | `node --version` | https://nodejs.org |
| npm 9+ | `npm --version` | Comes with Node |
| Git | `git --version` | https://git-scm.com |

---

## Step 1 — Get an OpenWeatherMap API Key (Free)

1. Go to https://openweathermap.org/api and click **Sign Up**
2. After signing in, go to https://home.openweathermap.org/api_keys
3. Copy the **Default** key shown (or create a new one)
4. ⚠️ New keys take **10–60 minutes** to activate. If you get 401 errors, wait and retry.

---

## Step 2 — Project Structure

Your project should look like this after extracting the zip:

```
WeatherLive_v2/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── .env                  ← create this (see Step 4)
│   └── data/
│       └── weather_data2.csv
└── frontend/
    ├── package.json
    ├── .env.local            ← create this (see Step 3)
    └── src/
        ├── App.js
        └── components/
            ├── Navbar.js / .css
            ├── WelcomePage.js / .css
            ├── Weather.js / .css
            ├── WeatherPredictor.js
            └── PredictForm.css
```

---

## Step 3 — Configure Frontend Environment

Open the file `frontend/.env.local` and replace the placeholder with your real API key:

```
REACT_APP_OPENWEATHER_API_KEY=abc123yourkeyhere
REACT_APP_BACKEND_URL=http://localhost:5000
```

> ✅ `.env.local` is already in `.gitignore` — it will never be committed.

---

## Step 4 — Set Up the Backend (Terminal 1)

Open a terminal, navigate to the `backend/` folder:

```bash
cd WeatherLive_v2/backend
```

### Create a Python virtual environment (recommended)

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If you see a permissions error on Windows, run this first:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal.

### Install dependencies

```bash
pip install -r requirements.txt
```

### Start the backend

```bash
python app.py
```

You should see:
```
No cache found — training models (one-time)...
  ✓ Trained: Linear Regression
  ✓ Trained: Decision Tree
  ✓ Trained: Random Forest
  ✓ Trained: Support Vector Regressor
  ★ Best model: Random Forest (cached to models_cache.joblib)
 * Running on http://0.0.0.0:5000
```

**First run takes ~30-60 seconds** (training 4 ML models).
Every run after that says `Loading cached models from disk...` and starts in ~2 seconds.

### Verify the backend is working

Open your browser and visit: http://localhost:5000/api/health

Expected response:
```json
{
  "status": "ok",
  "best_model": "Random Forest",
  "features": ["MinT", "RH1", "RH2", "Wind"]
}
```

---

## Step 5 — Set Up the Frontend (Terminal 2)

Open a **second terminal** (keep Terminal 1 running the backend):

```bash
cd WeatherLive_v2/frontend
```

### Install Node packages

```bash
npm install
```

The deprecation warnings are normal — they come from `react-scripts` (CRA) which uses older tooling. They don't affect the app.

### Start the frontend

```bash
npm start
```

The app opens automatically at http://localhost:3000

If port 3000 is taken, it will ask you to use another port — press **Y**.

---

## Step 6 — Verify Everything Works

### ✅ Welcome Page
- Visit http://localhost:3000
- You should see the animated hero page with two cards

### ✅ Live Weather
- Click **Live Weather** in the navbar
- Cards should show skeleton loaders briefly, then fill with city weather data
- Try searching a city like "London" or "Tokyo"
- If all cards show blank / error → your OpenWeatherMap key may not be activated yet (wait 10–60 min)

### ✅ ML Predictor
- Click **ML Predictor** in the navbar
- Enter test values:
  - Min Temperature: `18`
  - Humidity Morning: `72`
  - Humidity Afternoon: `45`
  - Wind Speed: `12`
- Click **Predict Temperature**
- You should see a result screen with the predicted temp, accuracy bars, and MSE table

---

## Common Issues & Fixes

### `'react-scripts' is not recognized`
```bash
npm install          # re-run in frontend/
```

### `ENOENT: no such file or directory, open '.env.local'`
Create the file manually — see Step 3.

### Weather cards show blank / 401 error in console
Your OpenWeatherMap API key is either wrong or not yet active. New keys take up to 60 minutes to activate.

### ML Predictor shows "Prediction failed" error
The backend isn't running. Check Terminal 1 and make sure you see `Running on http://0.0.0.0:5000`.

### `Cannot find module './components/Navbar'`
You may have missed copying `Navbar.js` and `Navbar.css`. They should be in `frontend/src/components/`.

### PowerShell script execution error (Windows)
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Port 5000 already in use (Windows)
```powershell
netstat -ano | findstr :5000
taskkill /PID <the_PID_shown> /F
```

### Port 5000 already in use (Mac — AirPlay uses 5000)
Edit `backend/app.py` last line — change port to 5001:
```python
port = int(os.environ.get("PORT", 5001))
```
Then update `frontend/.env.local`:
```
REACT_APP_BACKEND_URL=http://localhost:5001
```

---

## Production Build Test (Optional)

To test the production build locally before deploying to Netlify:

```bash
cd frontend
npm run build
npx serve -s build
```

Visit http://localhost:3000 — this is exactly what Netlify will serve.

---

## Quick Reference

| What | URL |
|---|---|
| Frontend (dev) | http://localhost:3000 |
| Backend health | http://localhost:5000/api/health |
| Backend predict | POST http://localhost:5000/api/predict |
| OpenWeatherMap keys | https://home.openweathermap.org/api_keys |

---

## Deployment → After Local Testing Works

Once everything runs locally, follow the steps in `README.md` to deploy:
- **Backend** → Render (start command: `gunicorn app:app`)
- **Frontend** → Netlify (build command: `npm run build`, publish: `frontend/build`)

Set the same env vars on each platform:
- Netlify: `REACT_APP_OPENWEATHER_API_KEY` and `REACT_APP_BACKEND_URL`
- Render: no extra env vars needed (PORT is auto-injected)
