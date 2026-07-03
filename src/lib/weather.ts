import { SITE } from "./config";
import { todayISO } from "./date";
import type { WeatherData } from "./types";

interface OWMCurrentResponse {
  main: { temp: number; feels_like: number; humidity: number };
  wind: { speed: number };
  weather: { id: number; description: string }[];
}

interface OWMForecastItem {
  dt: number;
  main: { temp_min: number; temp_max: number };
  pop: number;
}

interface OWMForecastResponse {
  list: OWMForecastItem[];
}

/** Data (YYYY-MM-DD) de um timestamp unix no fuso configurado. */
function dateInTz(unixSeconds: number, tz = SITE.timezone): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

export async function fetchWeather(): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.error("[weather] OPENWEATHER_API_KEY não configurada");
    return null;
  }

  const params = `lat=${SITE.latitude}&lon=${SITE.longitude}&appid=${apiKey}&units=metric&lang=pt_br`;

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?${params}`, {
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!currentRes.ok) throw new Error(`HTTP ${currentRes.status} (current)`);
    if (!forecastRes.ok) throw new Error(`HTTP ${forecastRes.status} (forecast)`);

    const current = (await currentRes.json()) as OWMCurrentResponse;
    const forecast = (await forecastRes.json()) as OWMForecastResponse;

    // O endpoint /forecast não separa por dia — filtramos os blocos de 3h de hoje
    // pra montar mín/máx/chance de chuva, já que o plano grátis não tem daily.
    const today = todayISO();
    const todaySlices = forecast.list.filter((item) => dateInTz(item.dt) === today);

    const min =
      todaySlices.length > 0
        ? Math.min(...todaySlices.map((s) => s.main.temp_min))
        : current.main.temp;
    const max =
      todaySlices.length > 0
        ? Math.max(...todaySlices.map((s) => s.main.temp_max))
        : current.main.temp;
    const precipitationChance =
      todaySlices.length > 0
        ? Math.round(Math.max(...todaySlices.map((s) => s.pop)) * 100)
        : 0;

    return {
      temperature: Math.round(current.main.temp),
      apparentTemperature: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      // wind.speed vem em m/s (units=metric) — UI espera km/h
      windSpeed: Math.round(current.wind.speed * 3.6),
      code: current.weather[0]?.id ?? 0,
      description: current.weather[0]?.description ?? "condição desconhecida",
      min: Math.round(min),
      max: Math.round(max),
      precipitationChance,
    };
  } catch (err) {
    console.error("[weather] falha ao consultar OpenWeatherMap:", (err as Error).message);
    return null;
  }
}
