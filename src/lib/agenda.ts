import { SITE } from "./config";
import { todayISO } from "./date";
import type { AgendaEvent } from "./types";

/**
 * Parser ICS minimalista para o "endereço secreto iCal" do Google Calendar.
 * Suporta eventos pontuais e recorrências simples (FREQ=DAILY / FREQ=WEEKLY
 * com BYDAY). Sem dependências externas.
 */

interface VEvent {
  summary: string;
  location?: string;
  dtstart?: string; // valor bruto
  dtstartParams?: string; // ex.: TZID=America/Sao_Paulo ou VALUE=DATE
  rrule?: string;
}

function unfoldLines(ics: string): string[] {
  // Linhas continuadas começam com espaço/tab (RFC 5545)
  return ics
    .replace(/\r\n[ \t]/g, "")
    .replace(/\r/g, "")
    .split("\n");
}

function parseVEvents(ics: string): VEvent[] {
  const events: VEvent[] = [];
  let current: VEvent | null = null;

  for (const line of unfoldLines(ics)) {
    if (line === "BEGIN:VEVENT") {
      current = { summary: "" };
      continue;
    }
    if (line === "END:VEVENT") {
      if (current) events.push(current);
      current = null;
      continue;
    }
    if (!current) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const rawKey = line.slice(0, idx);
    const value = line.slice(idx + 1);
    const [key, ...params] = rawKey.split(";");

    switch (key) {
      case "SUMMARY":
        current.summary = value.replace(/\\,/g, ",").replace(/\\n/g, " ").trim();
        break;
      case "LOCATION":
        current.location = value.replace(/\\,/g, ",").trim() || undefined;
        break;
      case "DTSTART":
        current.dtstart = value.trim();
        current.dtstartParams = params.join(";");
        break;
      case "RRULE":
        current.rrule = value.trim();
        break;
    }
  }
  return events;
}

const BYDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function weekdayOf(dateISO: string): string {
  // dateISO = YYYY-MM-DD; meio-dia UTC evita rollover de fuso
  const d = new Date(`${dateISO}T12:00:00Z`);
  return BYDAY_MAP[d.getUTCDay()];
}

/** Converte DTSTART em ISO string (ou marca allDay). */
function parseDtstart(ev: VEvent): { iso: string | null; allDay: boolean; dateOnly: string | null } {
  if (!ev.dtstart) return { iso: null, allDay: true, dateOnly: null };

  // VALUE=DATE → dia inteiro (YYYYMMDD)
  if (/^\d{8}$/.test(ev.dtstart)) {
    const dateOnly = `${ev.dtstart.slice(0, 4)}-${ev.dtstart.slice(4, 6)}-${ev.dtstart.slice(6, 8)}`;
    return { iso: null, allDay: true, dateOnly };
  }

  // YYYYMMDDTHHMMSS(Z?)
  const m = ev.dtstart.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return { iso: null, allDay: true, dateOnly: null };
  const [, y, mo, d, h, mi, s, z] = m;

  if (z === "Z") {
    return { iso: `${y}-${mo}-${d}T${h}:${mi}:${s}Z`, allDay: false, dateOnly: null };
  }
  // Com TZID assumimos o fuso local do usuário (caso comum: mesmo fuso)
  const offset = tzOffsetString(SITE.timezone);
  return { iso: `${y}-${mo}-${d}T${h}:${mi}:${s}${offset}`, allDay: false, dateOnly: `${y}-${mo}-${d}` };
}

function tzOffsetString(tz: string): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  })
    .formatToParts(new Date())
    .find((p) => p.type === "timeZoneName")?.value; // ex.: GMT-03:00
  const m = part?.match(/GMT([+-]\d{2}:\d{2})/);
  return m ? m[1] : "+00:00";
}

function dateInTz(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function occursToday(ev: VEvent, today: string): { start: string | null; allDay: boolean } | null {
  const { iso, allDay, dateOnly } = parseDtstart(ev);

  // Recorrência simples
  if (ev.rrule) {
    const freq = ev.rrule.match(/FREQ=(\w+)/)?.[1];
    const until = ev.rrule.match(/UNTIL=(\d{8})/)?.[1];
    if (until) {
      const untilISO = `${until.slice(0, 4)}-${until.slice(4, 6)}-${until.slice(6, 8)}`;
      if (today > untilISO) return null;
    }
    const startDate = dateOnly ?? (iso ? dateInTz(iso) : null);
    if (startDate && today < startDate) return null;

    if (freq === "DAILY") {
      return { start: iso ? shiftToToday(iso, today) : null, allDay };
    }
    if (freq === "WEEKLY") {
      const byday = ev.rrule.match(/BYDAY=([^;]+)/)?.[1]?.split(",") ?? [];
      const days = byday.length > 0 ? byday : startDate ? [weekdayOf(startDate)] : [];
      if (days.includes(weekdayOf(today))) {
        return { start: iso ? shiftToToday(iso, today) : null, allDay };
      }
    }
    return null;
  }

  // Evento pontual
  if (allDay) return dateOnly === today ? { start: null, allDay: true } : null;
  if (iso && dateInTz(iso) === today) return { start: iso, allDay: false };
  return null;
}

/** Mantém a hora original, mas na data de hoje (para recorrentes). */
function shiftToToday(iso: string, today: string): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return `${today}T${time}${tzOffsetString(SITE.timezone)}`;
}

export async function fetchAgenda(): Promise<AgendaEvent[]> {
  const url = process.env.CALENDAR_ICS_URL;
  if (!url) return [];

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ics = await res.text();
    const today = todayISO();

    const events: AgendaEvent[] = [];
    for (const ev of parseVEvents(ics)) {
      if (!ev.summary) continue;
      const occurrence = occursToday(ev, today);
      if (!occurrence) continue;
      events.push({
        title: ev.summary,
        start: occurrence.start,
        location: ev.location,
        allDay: occurrence.allDay,
      });
    }

    return events.sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  } catch (err) {
    console.error("[agenda] falha ao ler ICS:", (err as Error).message);
    return [];
  }
}
