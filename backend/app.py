import os
import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

MODEL_CACHE_PATH = 'models_cache.joblib'

# ── Feature columns (MaxT removed — it was the target, causing data leakage) ──
FEATURES = ['MinT', 'RH1', 'RH2', 'Wind']
TARGET   = 'MaxT'


def train_and_cache():
    """Train all models, evaluate, cache to disk. Called only on first cold start."""
    print("No cache found — training models (one-time)...")
    df = pd.read_csv('data/weather_data2.csv').dropna(subset=FEATURES + [TARGET])

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    models = {
        "Linear Regression":       LinearRegression(),
        "Decision Tree":           DecisionTreeRegressor(random_state=42, max_depth=12),
        "Random Forest":           RandomForestRegressor(n_estimators=50, n_jobs=-1, random_state=42),
        "Support Vector Regressor": SVR(kernel='rbf'),
    }

    for name, model in models.items():
        model.fit(X_train_s, y_train)
        print(f"  ✓ Trained: {name}")

    errors     = {n: mean_squared_error(y_test, m.predict(X_test_s)) for n, m in models.items()}
    accuracies = {n: r2_score(y_test, m.predict(X_test_s)) * 100         for n, m in models.items()}
    best_name  = min(errors, key=errors.get)

    cache = dict(models=models, scaler=scaler,
                 errors=errors, accuracies=accuracies, best_name=best_name)
    joblib.dump(cache, MODEL_CACHE_PATH)
    print(f"  ★ Best model: {best_name}  (cached to {MODEL_CACHE_PATH})")
    return cache


def load_or_train():
    if os.path.exists(MODEL_CACHE_PATH):
        print("Loading cached models from disk...")
        return joblib.load(MODEL_CACHE_PATH)
    return train_and_cache()


# ── Load once at startup ──────────────────────────────────────────────────────
_cache        = load_or_train()
models        = _cache['models']
scaler        = _cache['scaler']
model_errors  = _cache['errors']
model_accus   = _cache['accuracies']
best_name     = _cache['best_name']
best_model    = models[best_name]
# ─────────────────────────────────────────────────────────────────────────────


@app.route('/api/health', methods=['GET'])
def health():
    """Health-check endpoint — required by Render.com."""
    return jsonify({"status": "ok", "best_model": best_name, "features": FEATURES})


@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        body = request.json or {}
        if 'features' not in body:
            return jsonify({"error": "Missing 'features' key in request body"}), 400

        features = body['features']
        if len(features) != len(FEATURES):
            return jsonify({
                "error": f"Expected {len(FEATURES)} features {FEATURES}, got {len(features)}"
            }), 400

        feat_df  = pd.DataFrame([features], columns=FEATURES)
        feat_s   = scaler.transform(feat_df)

        best_pred   = float(best_model.predict(feat_s)[0])
        all_preds   = {n: float(m.predict(feat_s)[0]) for n, m in models.items()}

        return jsonify({
            "temperature":               best_pred,
            "model_used":                best_name,
            "model_accuracies":          model_accus,
            "model_errors":              model_errors,
            "predictions_from_all_models": all_preds,
        })

    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
