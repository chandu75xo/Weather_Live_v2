import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./WelcomePage.css";

const WelcomePage = () => {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(new Date().toLocaleDateString("en-IN", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    }));
  }, []);

  return (
    <div className="home">
      {/* Ambient background mesh */}
      <div className="home__mesh" aria-hidden="true">
        <div className="home__mesh-a" />
        <div className="home__mesh-b" />
      </div>

      {/* Top bar */}
      <div className="home__topbar up">
        <span className="home__live">
          <span className="home__pulse" />
          LIVE
        </span>
        <span className="home__date mono">{date}</span>
      </div>

      {/* Giant wordmark */}
      <div className="home__wordmark up-1" aria-hidden="true">WEATHER</div>

      {/* Nav tiles */}
      <div className="home__tiles up-2">
        <Link to="/live-weather" className="home__tile home__tile--a">
          <div className="home__tile-inner">
            <div className="home__tile-num mono">01</div>
            <div className="home__tile-label">Live Weather</div>
            <svg className="home__tile-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10"/>
            </svg>
          </div>
          {/* Decorative icon */}
          <svg className="home__tile-deco" viewBox="0 0 80 60" fill="none">
            <path d="M10 45 Q20 20 35 30 Q45 38 55 18 Q62 5 75 15" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.3"/>
            <circle cx="35" cy="30" r="3" fill="currentColor" opacity="0.4"/>
            <circle cx="55" cy="18" r="2" fill="currentColor" opacity="0.3"/>
          </svg>
        </Link>

        <Link to="/weather-predictor" className="home__tile home__tile--b">
          <div className="home__tile-inner">
            <div className="home__tile-num mono">02</div>
            <div className="home__tile-label">Weather Predictor</div>
            <svg className="home__tile-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10"/>
            </svg>
          </div>
          {/* Decorative bars */}
          <svg className="home__tile-deco" viewBox="0 0 80 60" fill="none">
            <rect x="8"  y="40" width="8" height="12" fill="currentColor" opacity="0.15" rx="1"/>
            <rect x="22" y="28" width="8" height="24" fill="currentColor" opacity="0.2" rx="1"/>
            <rect x="36" y="18" width="8" height="34" fill="currentColor" opacity="0.25" rx="1"/>
            <rect x="50" y="32" width="8" height="20" fill="currentColor" opacity="0.2" rx="1"/>
            <rect x="64" y="22" width="8" height="30" fill="currentColor" opacity="0.15" rx="1"/>
            <polyline points="12,38 26,26 40,16 54,30 68,20" stroke="currentColor" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      {/* Footer line */}
      <div className="home__footer up-3 mono">
        Real-time · ML-powered · India
      </div>
    </div>
  );
};

export default WelcomePage;
