import React, { useState, useEffect } from 'react';
import { THEME } from '../../constants/theme.js';
import { getLocalToday } from '../../utils/date.js';

export default function WeatherWidget({ lang }) {
  const [weather, setWeather] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [cityId, setCityId] = useState(() => localStorage.getItem("wx_city") || "auto");

  const fetchWeather = (lat, lon) => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
      .then(r => r.json())
      .then(d => {
        const code = d.current_weather?.weathercode;
        const temp = Math.round(d.current_weather?.temperature);
        setWeather({ temp, icon: WX_ICONS[code] || "🌡️", lat, lon });
      }).catch(() => {});
  };

  useEffect(() => {
    const city = CITIES.find(c => c.id === cityId);
    if (!city || city.id === "auto") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather(55.75, 37.62)
        );
      }
    } else {
      fetchWeather(city.lat, city.lon);
    }
  }, [cityId]);

  const selectCity = (id) => {
    setCityId(id);
    localStorage.setItem("wx_city", id);
    setShowPicker(false);
  };

  const city = CITIES.find(c => c.id === cityId);
  const cityName = city ? (lang === "ru" ? city.ru : city.en) : "";
  const tempStr = weather ? (weather.temp > 0 ? `+${weather.temp}` : `${weather.temp}`) + "°C" : "...";
  const wxUrl = weather ? `https://open-meteo.com/en/docs#latitude=${weather.lat}&longitude=${weather.lon}` : "#";

  return (
    <div style={{ position:"relative", display:"flex", alignItems:"center", gap:4 }}>
      <a href={wxUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontSize:12, color:THEME.textLight, textDecoration:"none", display:"flex", alignItems:"center", gap:3, padding:"2px 8px", borderRadius:10, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.6)", cursor:"pointer", transition:"all 0.15s" }}
        title={lang==="ru"?"Открыть погоду":"Open weather"}>
        {weather ? <>{weather.icon} <strong style={{ color:THEME.text }}>{tempStr}</strong></> : "🌡️..."}
      </a>
      <button onClick={() => setShowPicker(p => !p)}
        style={{ fontSize:11, color:THEME.textLight, background:"rgba(255,255,255,0.4)", border:"1px solid rgba(255,255,255,0.6)", borderRadius:10, padding:"2px 8px", cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>
        📍 {city ? (lang==="ru" ? city.ru.split(" ")[0] : city.en.split(" ")[0]) : ""}
      </button>
      {showPicker && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:200, background:"rgba(255,255,255,0.95)", backdropFilter:"none", borderRadius:14, border:"1px solid rgba(255,255,255,0.8)", boxShadow:"0 8px 32px rgba(0,0,0,0.12)", minWidth:200, overflow:"hidden" }}>
          {CITIES.map(c => (
            <div key={c.id} onClick={() => selectCity(c.id)}
              style={{ padding:"9px 14px", fontSize:12, cursor:"pointer", color: cityId===c.id ? THEME.sunsetDeep : THEME.text, background: cityId===c.id ? "rgba(255,176,124,0.15)" : "transparent", fontWeight: cityId===c.id ? 600 : 400, transition:"background 0.1s" }}>
              {lang==="ru" ? c.ru : c.en}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Routine Label ────────────────────────────────────────────────────
