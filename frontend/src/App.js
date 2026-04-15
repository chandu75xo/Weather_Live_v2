import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import WelcomePage from "./components/WelcomePage";
import Weather from "./components/Weather";
import WeatherPredictor from "./components/WeatherPredictor";
import "./index.css";

const App = () => (
  <Router>
    <Navbar />
    <Routes>
      <Route path="/"                   element={<WelcomePage />} />
      <Route path="/live-weather"       element={<Weather />} />
      <Route path="/weather-predictor"  element={<WeatherPredictor />} />
    </Routes>
  </Router>
);

export default App;
