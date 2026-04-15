import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Weather.css";

const CITIES = [
  "Hyderabad","Vijayawada","Delhi","Mumbai","Chennai",
  "Bangalore","Kolkata","Jaipur","Kochi","Ahmedabad","Noida","Darjeeling",
];

const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

const conditionMeta = (desc = "") => {
  const d = desc.toLowerCase();
  if (d.includes("thunder"))  return { symbol: "⛈", color: "#a78bfa" };
  if (d.includes("drizzle"))  return { symbol: "🌦", color: "#7dd3fc" };
  if (d.includes("rain"))     return { symbol: "🌧", color: "#60a5fa" };
  if (d.includes("snow"))     return { symbol: "❄", color: "#e0f2fe" };
  if (d.includes("fog") || d.includes("mist") || d.includes("haze"))
                              return { symbol: "〰", color: "#94a3b8" };
  if (d.includes("cloud"))    return { symbol: "⛅", color: "#93c5fd" };
  if (d.includes("clear"))    return { symbol: "○", color: "#fbbf24" };
  return                             { symbol: "◈", color: "#38bdf8" };
};

const Skel = () => (
  <div className="wcard wcard--skel">
    <div className="sk sk--sym" />
    <div className="sk sk--city" />
    <div className="sk sk--temp" />
    <div className="sk sk--row" />
  </div>
);

const Weather = () => {
  const [cities, setCities]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState("");
  const [found, setFound]           = useState(null);
  const [searching, setSearching]   = useState(false);
  const [noResult, setNoResult]     = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await Promise.all(
          CITIES.map(c =>
            axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${c}&appid=${API_KEY}&units=metric`)
          )
        );
        setCities(res.map(r => ({
          city:      r.data.name,
          temp:      r.data.main.temp,
          feels:     r.data.main.feels_like,
          desc:      r.data.weather[0].description,
          humidity:  r.data.main.humidity,
          wind:      r.data.wind.speed,
          ...conditionMeta(r.data.weather[0].description),
        })));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const doSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true); setFound(null); setNoResult(false);
    try {
      const r = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${query.trim()}&appid=${API_KEY}&units=metric`
      );
      setFound({
        city:     r.data.name,
        temp:     r.data.main.temp,
        feels:    r.data.main.feels_like,
        desc:     r.data.weather[0].description,
        humidity: r.data.main.humidity,
        wind:     r.data.wind.speed,
        ...conditionMeta(r.data.weather[0].description),
      });
    } catch { setNoResult(true); }
    finally { setSearching(false); }
  };

  const clearSearch = () => { setQuery(""); setFound(null); setNoResult(false); };

  return (
    <div className="wx-page">
      {/* Header row */}
      <div className="wx-head up">
        <h1 className="wx-head__title">
          Live Weather
          <span className="wx-head__live">
            <span className="wx-pulse" />LIVE
          </span>
        </h1>
      </div>

      {/* Search */}
      <form className="wx-search up-1" onSubmit={doSearch}>
        <svg className="wx-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="wx-search__input"
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) clearSearch(); }}
          placeholder="Search city…"
          type="text"
        />
        {(found || noResult) && (
          <button type="button" className="wx-search__clear" onClick={clearSearch}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <button className="wx-search__btn" type="submit" disabled={searching}>
          {searching ? <span className="wx-spinner" /> : "Go"}
        </button>
      </form>

      {/* Search result */}
      {(found || noResult) && (
        <div className={`wx-result up${noResult ? " wx-result--err" : ""}`}>
          {noResult
            ? <span className="wx-result__err-msg">No results for "{query}"</span>
            : found && <CityCard data={found} large />
          }
        </div>
      )}

      {/* Divider label */}
      <div className="wx-section-label up-2 mono">INDIA — TOP CITIES</div>

      {/* Grid */}
      <div className="wx-grid up-2">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <Skel key={i} />)
          : cities.map((d, i) => <CityCard key={i} data={d} />)
        }
      </div>
    </div>
  );
};

const CityCard = ({ data, large }) => (
  <div className={`wcard${large ? " wcard--large" : ""} glass`} style={{ "--c": data.color }}>
    <div className="wcard__sym" style={{ color: data.color }}>{data.symbol}</div>
    <div className="wcard__main">
      <div className="wcard__city">{data.city}</div>
      <div className="wcard__temp mono">{data.temp.toFixed(1)}<span>°C</span></div>
      <div className="wcard__desc">{data.desc}</div>
      <div className="wcard__row mono">
        <span>{data.humidity}<small>%</small></span>
        <span className="wcard__sep">·</span>
        <span>{data.wind}<small>m/s</small></span>
        {large && <><span className="wcard__sep">·</span><span>feels {data.feels?.toFixed(1)}<small>°C</small></span></>}
      </div>
    </div>
  </div>
);

export default Weather;
