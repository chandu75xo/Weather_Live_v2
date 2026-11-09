import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./PredictForm.css";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "https://weather-live-webapp-1.onrender.com";
const API_KEY  = process.env.REACT_APP_OPENWEATHER_API_KEY;

/* ── Field definitions ─────────────────────────────────── */
const FIELDS = [
  { name: "MinT", label: "Min Temp",     unit: "°C",   placeholder: "e.g. 18" },
  { name: "RH1",  label: "Humidity AM",  unit: "%",    placeholder: "e.g. 72" },
  { name: "RH2",  label: "Humidity PM",  unit: "%",    placeholder: "e.g. 45" },
  { name: "Wind", label: "Wind Speed",   unit: "km/h", placeholder: "e.g. 12" },
];

/* ── Accuracy bar ──────────────────────────────────────── */
const Bar = ({ name, value, best }) => (
  <div className={`bar${best ? " bar--best" : ""}`}>
    <div className="bar__name">{name}</div>
    <div className="bar__track">
      <div className="bar__fill" style={{ width: `${Math.max(0, Math.min(100, value)).toFixed(1)}%` }} />
    </div>
    <div className="bar__val mono">{Math.max(0, value).toFixed(1)}%</div>
  </div>
);

/* ── Ref data item (live weather) ──────────────────────── */
const RefItem = ({ label, value, unit, onUse, fieldName }) => (
  <div className="ref__item">
    <div className="ref__meta">
      <span className="ref__label">{label}</span>
      <span className="ref__val mono">{value !== null ? `${value}${unit}` : "—"}</span>
    </div>
    <button
      className="ref__use"
      onClick={() => onUse(fieldName, value)}
      disabled={value === null}
      title={`Use ${value}${unit}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
        <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
      </svg>
      Use
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════ */
const WeatherPredictor = () => {
  const [form, setForm]           = useState({ MinT: "", RH1: "", RH2: "", Wind: "" });
  const [touched, setTouched]     = useState({});
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [formErr, setFormErr]     = useState("");

  // Live location weather
  const [locData, setLocData]     = useState(null);   // fetched weather
  const [locName, setLocName]     = useState("");
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | ok | denied | error

  /* ── Fetch live location data ─────────────────────── */
  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocStatus("error"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=${API_KEY}&units=metric`
          );
          const d = r.data;
          setLocName(`${d.name}, ${d.sys.country}`);
          setLocData({
            MinT: parseFloat(d.main.temp_min.toFixed(1)),
            RH1:  d.main.humidity,
            RH2:  Math.round(d.main.humidity * 0.75), // estimated afternoon dip
            Wind: parseFloat((d.wind.speed * 3.6).toFixed(1)), // m/s → km/h
            temp:     d.main.temp,
            desc:     d.weather[0].description,
            feels:    d.main.feels_like,
          });
          setLocStatus("ok");
        } catch { setLocStatus("error"); }
      },
      () => setLocStatus("denied"),
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => { fetchLocation(); }, [fetchLocation]);

  /* ── Use ref value ────────────────────────────────── */
  const useRef = (name, value) => {
    if (value === null) return;
    setForm(f => ({ ...f, [name]: String(value) }));
    setTouched(t => ({ ...t, [name]: true }));
  };

  const useAll = () => {
    if (!locData) return;
    setForm({ MinT: String(locData.MinT), RH1: String(locData.RH1), RH2: String(locData.RH2), Wind: String(locData.Wind) });
    setTouched({ MinT: true, RH1: true, RH2: true, Wind: true });
  };

  /* ── Form handling ────────────────────────────────── */
  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormErr("");
  };

  const handleSubmit = async () => {
    const features = FIELDS.map(({ name }) => parseFloat(form[name]));
    if (features.some(isNaN)) {
      setFormErr("Fill in all 4 fields.");
      setTouched({ MinT: true, RH1: true, RH2: true, Wind: true });
      return;
    }
    setLoading(true); setFormErr("");
    try {
      const r = await axios.post(`${BACKEND}/api/predict`, { features });
      setResult(r.data);
    } catch (e) {
      setFormErr(e.response?.data?.error || "Prediction failed — service is not running");
    } finally { setLoading(false); }
  };

  const reset = () => {
    setForm({ MinT: "", RH1: "", RH2: "", Wind: "" });
    setTouched({}); setResult(null); setFormErr("");
  };

  /* ── Result screen ──────────────────────────────── */
  if (result) {
    const { temperature, model_used, model_accuracies = {}, model_errors = {}, predictions_from_all_models = {} } = result;
    return (
      <div className="pp">
        <div className="pp__head up">
          <h1 className="pp__title">Prediction Result</h1>
        </div>

        {/* Hero */}
        <div className="res-hero glass up-1">
          <div className="res-hero__lbl mono">PREDICTED MAX TEMP</div>
          <div className="res-hero__val mono">
            {parseFloat(temperature).toFixed(2)}
            <span>°C</span>
          </div>
          <div className="res-hero__model mono">
            <span className="res-hero__tag">★ BEST</span>
            {model_used}
          </div>
        </div>

        {/* All model predictions */}
        <div className="res-models up-2">
          {Object.entries(predictions_from_all_models).map(([n, v]) => (
            <div key={n} className={`res-model glass${n === model_used ? " res-model--best" : ""}`}>
              <div className="res-model__name">{n}</div>
              <div className="res-model__val mono">{parseFloat(v).toFixed(2)}°C</div>
              {n === model_used && <div className="res-model__star">★</div>}
            </div>
          ))}
        </div>

        {/* Accuracy bars */}
        <div className="res-section glass up-3">
          <div className="res-section__hd mono">R² ACCURACY</div>
          <div className="bar-list">
            {Object.entries(model_accuracies)
              .sort(([,a],[,b]) => b - a)
              .map(([n, v]) => <Bar key={n} name={n} value={v} best={n === model_used} />)
            }
          </div>
        </div>

        {/* MSE */}
        <div className="res-section glass up-4">
          <div className="res-section__hd mono">MEAN SQUARED ERROR</div>
          <table className="mse-table mono">
            <tbody>
              {Object.entries(model_errors)
                .sort(([,a],[,b]) => a - b)
                .map(([n, v]) => (
                  <tr key={n} className={n === model_used ? "mse-table__best" : ""}>
                    <td>{n === model_used && "★ "}{n}</td>
                    <td>{parseFloat(v).toFixed(4)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <button className="pp__back" onClick={reset}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
            <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
          </svg>
          New prediction
        </button>
      </div>
    );
  }

  /* ── Input form ─────────────────────────────────── */
  return (
    <div className="pp">
      <div className="pp__head up">
        <h1 className="pp__title">Weather Predictor</h1>
      </div>

      {/* Live reference panel */}
      <div className={`ref glass up-1${locStatus === "ok" ? " ref--loaded" : ""}`}>
        <div className="ref__header">
          <div className="ref__title-row">
            {locStatus === "ok" && <span className="ref__pulse-dot" />}
            <span className="ref__hd mono">
              {locStatus === "loading" && "Fetching location…"}
              {locStatus === "ok"      && locName}
              {locStatus === "denied"  && "Location access denied"}
              {locStatus === "error"   && "Location unavailable"}
              {locStatus === "idle"    && ""}
            </span>
          </div>

          {locStatus === "ok" && (
            <button className="ref__use-all" onClick={useAll}>
              Fill all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                <polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>
              </svg>
            </button>
          )}

          {(locStatus === "denied" || locStatus === "error") && (
            <button className="ref__retry" onClick={fetchLocation}>Retry</button>
          )}
        </div>

        {/* Current conditions strip */}
        {locStatus === "ok" && locData && (
          <>
            <div className="ref__conditions mono">
              <span className="ref__cur-temp">{locData.temp?.toFixed(1)}°C</span>
              <span className="ref__cur-desc">{locData.desc}</span>
              <span className="ref__cur-feels">feels {locData.feels?.toFixed(1)}°C</span>
            </div>
            <div className="ref__divider" />
            <div className="ref__items">
              <RefItem label="Min Temp"    unit="°C"   value={locData.MinT} fieldName="MinT" onUse={useRef} />
              <RefItem label="Humidity AM" unit="%"    value={locData.RH1}  fieldName="RH1"  onUse={useRef} />
              <RefItem label="Humidity PM" unit="%"    value={locData.RH2}  fieldName="RH2"  onUse={useRef} />
              <RefItem label="Wind"        unit=" km/h" value={locData.Wind} fieldName="Wind" onUse={useRef} />
            </div>
            <div className="ref__note mono">
              Tap <strong>Use</strong> to fill a field · <strong>Fill all</strong> to fill all at once
            </div>
          </>
        )}

        {locStatus === "loading" && (
          <div className="ref__loading">
            <span className="wx-spinner" />
          </div>
        )}

        {(locStatus === "denied" || locStatus === "error") && (
          <div className="ref__denied mono">
            {locStatus === "denied" ? "Allow location access in your browser to see live reference values." : "Could not retrieve location data."}
          </div>
        )}
      </div>

      {/* Input form */}
      <div className="pform glass up-2">
        <div className="pform__grid">
          {FIELDS.map(({ name, label, unit, placeholder }) => {
            const hasErr = touched[name] && !form[name];
            return (
              <div key={name} className={`pf${hasErr ? " pf--err" : ""}`}>
                <label className="pf__label mono">
                  {label}
                  <span className="pf__unit">{unit}</span>
                </label>
                <input
                  type="number"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  onBlur={() => setTouched(t => ({ ...t, [name]: true }))}
                  placeholder={placeholder}
                  className="pf__input mono"
                  step="any"
                />
              </div>
            );
          })}
        </div>

        {formErr && (
          <div className="pform__err mono">{formErr}</div>
        )}

        <div className="pform__actions">
          <button
            className={`pform__predict${loading ? " loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <><span className="wx-spinner wx-spinner--dark" /> Predicting…</>
              : <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Predict
                </>
            }
          </button>
          <button className="pform__reset" onClick={reset} disabled={loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.8"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherPredictor;
