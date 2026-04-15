import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const { pathname } = useLocation();
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [time, setTime]           = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const links = [
    { to: "/",                  label: "Home" },
    { to: "/live-weather",      label: "Live Weather" },
    { to: "/weather-predictor", label: "Weather Predictor" },
  ];

  return (
    <nav className={`nav${scrolled ? " nav--up" : ""}`}>
      {/* Brand */}
      <Link to="/" className="nav__brand">
        <svg className="nav__brand-icon" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.34 4.34l1.42 1.42M14.24 14.24l1.42 1.42M4.34 15.66l1.42-1.42M14.24 5.76l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="nav__brand-name">WX<strong>LIVE</strong></span>
      </Link>

      {/* Desktop links */}
      <ul className="nav__links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className={`nav__link${pathname === to ? " nav__link--on" : ""}`}>
              {label}
              {pathname === to && <span className="nav__dot" />}
            </Link>
          </li>
        ))}
      </ul>

      {/* Clock */}
      <div className="nav__clock mono">{time}</div>

      {/* Hamburger */}
      <button className={`nav__ham${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(v => !v)} aria-label="menu">
        <span /><span /><span />
      </button>

      {/* Mobile dropdown */}
      <div className={`nav__drop${menuOpen ? " nav__drop--open" : ""}`}>
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className={`nav__drop-link${pathname === to ? " on" : ""}`}>{label}</Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
