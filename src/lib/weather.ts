import { SITE } from "./config";
import type { WeatherData } from "./types";

/** WMO weather codes → pt-BR */
const WEATHER_CODES: Record<number, string> = {
  0: "céu limpo",
  1: "predominantemente limpo",
  2: "parcialmente nublado",
  3: "encoberto",
  45: "neblina",
  48: "neblina com geada",
  51: "garoa leve",
  53: "garoa moderada",
  55: "garoa intensa",
  61: "chuva fraca",
  63: "chuva moderada",
  65: "chuva forte",
  66: "chuva congelante fraca",
  67: "chuva congelante forte",
  71: "neve fraca",
  73: "neve moderada",
  75: "neve forte",
  80: "pancadas de chuva fracas",
  81: "pancadas de chuva moderadas",
  82: "pancadas de chuva fortes",
  95: "tempestade",
  96: "tempestade com granizo leve",
  99: "tempestade com granizo forte",
};

export async function fetchWeather(): Promise<WeatherData | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${SITE.latitude}&longitude=${SITE.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
    `&timezone=${encodeURIComponent(SITE.timezone)}&forecast_days=1`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const code: number = data.current.weather_code;

    return {
      temperature: Math.round(data.current.temperature_2m),
      apparentTemperature: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      code,
      description: WEATHER_CODES[code] ?? "condição desconhecida",
      min: Math.round(data.daily.temperature_2m_min[0]),
      max: Math.round(data.daily.temperature_2m_max[0]),
      precipitationChance: data.daily.precipitation_probability_max[0] ?? 0,
    };
  } catch (err) {
    console.error("[weather] falha ao consultar Open-Meteo:", (err as Error).message);
    return null;
  }
}
