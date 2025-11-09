"use client";

import { useEffect, useState } from 'react';
import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, buttonVariants } from '@/lib/shadcn/ui';
import { Icon } from '@iconify/react';

type Recurrence = {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  daysOfWeek?: number[]; // 0=Domingo ... 6=Sabado
  endDate?: string; // ISO date
};

type ChurchEventListItem = {
  id: string;
  title?: string | null;
  description?: string | null;
  start_datetime?: string | null;
  end_datetime?: string | null;
  is_online?: boolean | null;
  meeting_link?: string | null;
  cover_image?: string | null;
  location?: { name?: string | null; address?: string | null; latitude?: number | null; longitude?: number | null; waze_link?: string | null; googleMaps_link?: string | null } | string | null;
  recurrence?: Recurrence | string | null;
};

function formatTime12(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  h = h % 12;
  if (h === 0) h = 12;
  const mm = String(m).padStart(2, '0');
  return `${h}:${mm} ${am ? 'am' : 'pm'}`;
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return 'Fecha por definir';
  const locale = 'es-ES';
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate && endDate) {
    const sameDay = startDate.toDateString() === endDate.toDateString();
    const datePart = startDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const startTime = formatTime12(startDate);
    const endTime = formatTime12(endDate);
    return sameDay ? `${datePart} · ${startTime} – ${endTime}` : `${datePart} · ${startTime} – ${endDate.toLocaleDateString(locale)} ${endTime}`;
  }
  if (startDate) {
    return `${startDate.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · ${formatTime12(startDate)}`;
  }
  return `Hasta el ${endDate!.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })} a las ${formatTime12(endDate!)}`;
}

function parseRecurrence(rec?: Recurrence | string | null): Recurrence | null {
  if (!rec) return null;
  if (typeof rec === 'string') {
    try { return JSON.parse(rec) as Recurrence; } catch { return null; }
  }
  return rec as Recurrence;
}

const WEEKDAY_MAP_ICS = ['SU','MO','TU','WE','TH','FR','SA'];
const WEEKDAY_ES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

function formatRecurrenceLabel(rec: Recurrence, start?: string | null, end?: string | null) {
  const locale = 'es-ES';
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const startTime = startDate ? formatTime12(startDate) : '';
  const endTime = endDate ? formatTime12(endDate) : '';

  // Helper to render time range
  const timeRange = startTime && endTime ? ` • de ${startTime} a ${endTime}` : startTime ? ` • a las ${startTime}` : '';

  // Map for pluralized Spanish weekday names
  const WEEKDAY_ES_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

  // If weekly with daysOfWeek, show: "Todos los <días> • de HH:MM a HH:MM"
  if (rec.frequency === 'weekly') {
    const daysText = (rec.daysOfWeek && rec.daysOfWeek.length)
      ? (() => {
          const names = rec.daysOfWeek.map((d) => WEEKDAY_ES_PLURAL[d] || '').filter(Boolean);
          if (names.length === 1) return names[0];
          if (names.length === 2) return `${names[0]} y ${names[1]}`;
          return names.slice(0, -1).join(', ') + ' y ' + names[names.length - 1];
        })()
      : 'semanas';

    const prefix = rec.interval && rec.interval > 1 ? `Cada ${rec.interval} semanas, ` : 'Todos los ';
    const until = rec.endDate ? (() => {
      const d = new Date(rec.endDate!);
      return ` • hasta el ${d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}`;
    })() : '';
    return `${prefix}${daysText}${timeRange}`;
  }

  // Daily: "Todos los días • de HH:MM a HH:MM" (or every N days)
  if (rec.frequency === 'daily') {
    const prefix = rec.interval && rec.interval > 1 ? `Cada ${rec.interval} días` : 'Todos los días';
    const until = rec.endDate ? (() => {
      const d = new Date(rec.endDate!);
      return ` • hasta el ${d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}`;
    })() : '';
    return `${prefix}${timeRange}`;
  }

  // Monthly or yearly fallback: concise format
  const freqMap: Record<string, string> = {
    monthly: 'mes',
    yearly: 'año',
  };
  const prefix = rec.interval && rec.interval > 1
    ? `Cada ${rec.interval} ${freqMap[rec.frequency] || rec.frequency}`
    : `Cada ${freqMap[rec.frequency] || rec.frequency}`;
  const until = rec.endDate ? (() => {
    const d = new Date(rec.endDate!);
    return ` • hasta ${d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  })() : '';
  return `${prefix}${timeRange}${until}`;
}

function formatEventDateLabel(ev: ChurchEventListItem) {
  const rec = parseRecurrence(ev.recurrence);
  if (rec) return formatRecurrenceLabel(rec, ev.start_datetime, ev.end_datetime);
  return formatDateRange(ev.start_datetime, ev.end_datetime);
}

function toIcsDateUTC(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}T${hh}${mm}${ss}Z`;
}

function buildICS(ev: ChurchEventListItem) {
  const uid = `${ev.id}@ibchn.org`;
  const now = toIcsDateUTC(new Date());
  const start = ev.start_datetime ? new Date(ev.start_datetime) : null;
  const end = ev.end_datetime ? new Date(ev.end_datetime) : null;
  const dtStart = start ? toIcsDateUTC(start) : '';
  const dtEnd = end ? toIcsDateUTC(end) : '';

  const rec = parseRecurrence(ev.recurrence);
  let rrule = '';
  if (rec && rec.frequency) {
    const parts: string[] = [];
    parts.push(`FREQ=${rec.frequency.toUpperCase()}`);
    if (rec.interval && rec.interval > 1) parts.push(`INTERVAL=${rec.interval}`);
    if (rec.daysOfWeek && rec.daysOfWeek.length) {
      const bydays = rec.daysOfWeek.map(d => WEEKDAY_MAP_ICS[d] || '').filter(Boolean).join(',');
      if (bydays) parts.push(`BYDAY=${bydays}`);
    }
    if (rec.endDate) {
      const untilDate = new Date(rec.endDate);
      // set to end of day UTC
      untilDate.setUTCHours(23,59,59,0);
      parts.push(`UNTIL=${toIcsDateUTC(untilDate)}`);
    }
    rrule = `RRULE:${parts.join(';')}`;
  }

  // Build description including map links
  const descriptionLine = (() => {
    const base = (ev.description || '').replace(/\n|\r/g, ' ').trim();
    const loc: any = (ev as any)?.location;
    let lat: number | undefined;
    let lon: number | undefined;
    let waze = '';
    let gmaps = '';
    if (loc && typeof loc === 'object') {
      lat = loc?.latitude ?? undefined;
      lon = loc?.longitude ?? undefined;
      if (loc?.waze_link) waze = String(loc.waze_link);
      if (loc?.googleMaps_link) gmaps = String(loc.googleMaps_link);
    }
    if (!waze && lat != null && lon != null) {
      waze = `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
    }
    if (!gmaps && lat != null && lon != null) {
      gmaps = `https://www.google.com/maps?q=${lat},${lon}`;
    }
    const parts: string[] = [];
    if (base) parts.push(base);
    if (waze) parts.push(`Waze: ${waze}`);
    if (gmaps) parts.push(`Google Maps: ${gmaps}`);
    if (parts.length === 0) return '';
    return `DESCRIPTION:${parts.join(' | ')}`;
  })();

  const geoLine = (() => {
    const loc: any = (ev as any)?.location;
    if (loc && typeof loc === 'object' && loc?.latitude != null && loc?.longitude != null) {
      return `GEO:${loc.latitude};${loc.longitude}`;
    }
    return '';
  })();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IBC HN//Horarios//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtStart ? `DTSTART:${dtStart}` : '',
    dtEnd ? `DTEND:${dtEnd}` : '',
    `SUMMARY:${(ev.title || 'Evento').replace(/\n|\r/g,' ')}`,
    descriptionLine,
    (() => {
      const loc = (ev as any)?.location;
      if (!loc) return '';
      if (typeof loc === 'string') return `LOCATION:${loc}`;
      const name = loc?.name || '';
      const addr = loc?.address ? `, ${loc.address}` : '';
      return `LOCATION:${(name + addr).trim()}`;
    })(),
    geoLine,
    rrule,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

function downloadICS(ev: ChurchEventListItem) {
  const ics = buildICS(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = (ev.title || 'evento').toLowerCase().replace(/[^a-z0-9]+/gi,'-');
  a.download = `${safeTitle || 'evento'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function getAssetUrl(id?: string | null) {
  if (!id) return null;
  const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || process.env.DIRECTUS_URL || 'http://localhost';
  return `${baseUrl.replace(/\/$/, '')}/assets/${id}?fit=cover&width=600&height=340&quality=80`;
}

function getNextOccurrence(ev: ChurchEventListItem, from = new Date()): Date | null {
  const rec = parseRecurrence(ev.recurrence);
  const start = ev.start_datetime ? new Date(ev.start_datetime) : null;
  const end = ev.end_datetime ? new Date(ev.end_datetime) : null;

  const clampByUntil = (d: Date | null) => {
    if (!rec?.endDate || !d) return d;
    const until = new Date(rec.endDate);
    // End of day
    until.setHours(23,59,59,999);
    return d.getTime() <= until.getTime() ? d : null;
  };

  // If no recurrence: next is start if it's in the future
  if (!rec) {
    if (start && start.getTime() >= from.getTime()) return start;
    return null;
  }

  // Daily recurrence
  if (rec.frequency === 'daily') {
    const interval = Math.max(1, rec.interval || 1);
    if (!start) return null;
    // Determine base day/time from start
    const base = new Date(start);
    // If from is before base, next is base
    if (from.getTime() <= base.getTime()) return clampByUntil(base);
    // Compute days difference
    const msPerDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor((from.getTime() - base.getTime()) / msPerDay);
    const steps = Math.floor(diffDays / interval) + 1;
    const next = new Date(base.getTime() + steps * interval * msPerDay);
    // Keep original time of day from start
    next.setHours(base.getHours(), base.getMinutes(), base.getSeconds(), base.getMilliseconds());
    return clampByUntil(next);
  }

  // Weekly recurrence
  if (rec.frequency === 'weekly') {
    const interval = Math.max(1, rec.interval || 1);
    const days = (rec.daysOfWeek && rec.daysOfWeek.length ? rec.daysOfWeek : [ (start ? start.getDay() : from.getDay()) ]).sort((a,b)=>a-b);
    if (!start) return null;

    // Find the Monday-based week index from base start
    // We'll iterate upcoming weeks by interval and pick earliest matching day >= from
    const candidateDates: Date[] = [];

    // Consider the current week window starting from 'from' going ahead up to interval*2 weeks to be safe
    for (let w = 0; w < 12; w++) {
      // Compute the start of this cycle window: base + w*interval weeks
      const cycleStart = new Date(start);
      cycleStart.setDate(start.getDate() + w * interval * 7);

      // For each day in daysOfWeek, compute that day's date with the time from start
      for (const dow of days) {
        const d = new Date(cycleStart);
        // Move to the requested weekday within this week
        const delta = dow - d.getDay();
        d.setDate(d.getDate() + delta);
        d.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
        if (d.getTime() >= from.getTime()) candidateDates.push(d);
      }

      // If we found any in this window, stop early after pushing all candidates of this window
      if (candidateDates.length) break;
    }

    // If none in the first windows, approximate by jumping forward by interval weeks from from date
    if (!candidateDates.length) {
      const fromCycleAligned = new Date(from);
      // Align to start's weekday time first
      fromCycleAligned.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
      // Try next few weeks respecting interval
      for (let w = 0; w < 12 && !candidateDates.length; w++) {
        for (const dow of days) {
          const d = new Date(fromCycleAligned);
          const deltaToDow = (dow - d.getDay() + 7) % 7;
          d.setDate(d.getDate() + deltaToDow + w * interval * 7);
          if (d.getTime() >= from.getTime()) candidateDates.push(d);
        }
      }
    }

    const next = candidateDates.sort((a,b)=>a.getTime()-b.getTime())[0] || null;
    return clampByUntil(next);
  }

  // Monthly / yearly (basic fallback): if original start is in the future, use it; else no next (to keep logic simple)
  if (start && start.getTime() >= from.getTime()) return clampByUntil(start);
  return null;
}

// If an event is currently active (now between start and end), treat it as the nearest
function getActiveOrNext(ev: ChurchEventListItem, from = new Date()): Date | null {
  const start = ev.start_datetime ? new Date(ev.start_datetime) : null;
  const end = ev.end_datetime ? new Date(ev.end_datetime) : null;
  if (start && end) {
    if (from.getTime() >= start.getTime() && from.getTime() < end.getTime()) {
      // Keep it as the nearest until it ends
      return new Date(from);
    }
  }
  return getNextOccurrence(ev, from);
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const diff = target ? Math.max(0, target.getTime() - now.getTime()) : 0;
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, over: totalSeconds <= 0 };
}

function Countdown({ target }: { target: Date }) {
  const { days, hours, minutes, seconds, over } = useCountdown(target);
  if (over) return null;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  parts.push(`${hours}h`, `${minutes}m`, `${seconds}s`);
  return (
    <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] text-slate-500">
      <Icon icon="mdi:clock-outline" className="h-3 w-3 text-slate-400" />
      <span>Comienza en {parts.join(' ')}</span>
    </div>
  );
}

export default function HorariosClient() {
  const [events, setEvents] = useState<ChurchEventListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setError(null);
        const res = await fetch('/api/events?limit=50', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setEvents(json.data as ChurchEventListItem[]);
      } catch (e: any) {
        if (!cancelled) {
          setError('No se pudieron cargar los eventos.');
          setEvents([]);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Prepare nearest event and countdown unconditionally to keep hook order stable
  const now = new Date();
  const nextMap = new Map((events ?? []).map((e) => [e.id, getActiveOrNext(e, now)] as const));
  const nearestEntry = Array.from(nextMap.entries()).filter(([, d]) => !!d).sort((a, b) => (a[1]!.getTime() - b[1]!.getTime()))[0];
  const nearestId = nearestEntry ? nearestEntry[0] : undefined;
  const nearestDate = nearestEntry ? nearestEntry[1]! : null;
  // Countdown ticking state for the nearest event to enable the 10-minute switch
  const nearestCountdown = useCountdown(nearestDate);

  if (error) {
    return <div className="text-center text-slate-600 py-10">{error}</div>;
  }

  if (events === null) {
    return <div className="text-center text-slate-600 py-10">Cargando eventos…</div>;
  }

  if (!events || events.length === 0) {
    return <div className="text-center text-slate-600 py-10">No hay eventos programados por ahora.</div>;
  }

  // Ordenar por el evento más próximo usando el mapa ya calculado
  const sortedEvents = [...(events ?? [])].sort((a, b) => {
    const da = nextMap.get(a.id);
    const db = nextMap.get(b.id);
    if (da && db) return da.getTime() - db.getTime();
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {sortedEvents.map((ev) => {
        const dateLabel = formatEventDateLabel(ev);
        const isOnline = !!ev.is_online;
        const locationName = (ev as any)?.location?.name as string | undefined;
        const cover = getAssetUrl((ev as any)?.cover_image as string | undefined);

        return (
          <Card key={ev.id} className="relative flex flex-col overflow-hidden border-slate-200/50 bg-white/20 backdrop-blur-2xl shadow-lg">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={ev.title || 'cover'} className="w-full h-[140px] object-cover" />
            ) : null}
            <CardHeader className="py-3">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-base text-slate-800 leading-tight line-clamp-2">
                  {ev.title || 'Evento'}
                </CardTitle>
                <Badge variant={isOnline ? 'default' : 'secondary'} className="shrink-0">
                  {isOnline ? 'En línea' : 'Presencial'}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-600 mt-1">
                {dateLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex-1">
              {ev.description ? (
                <p className="text-xs text-slate-700 line-clamp-3">
                  {ev.description}
                </p>
              ) : null}
              {locationName ? (
                <p className="text-xs text-slate-500 mt-2">Lugar: {locationName}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ev.id === nearestId && nearestDate ? (
                  <Countdown target={nearestDate} />
                ) : null}
                {(() => {
                  // Mostrar botón de transmisión si faltan <= 10 minutos para el evento más próximo o si el evento está en curso, y hay meeting_link
                  const isActive = (() => {
                    const start = ev.start_datetime ? new Date(ev.start_datetime) : null;
                    const end = ev.end_datetime ? new Date(ev.end_datetime) : null;
                    return !!(start && end && now >= start && now < end);
                  })();
                  const remainingMs = (() => {
                    if (!nearestId || !nearestDate) return Infinity;
                    // nearestCountdown is ticking for the nearest event
                    // @ts-ignore - declared in component scope
                    const nc = nearestCountdown as { days: number; hours: number; minutes: number; seconds: number; over: boolean } | undefined;
                    if (!nc || nc.over) return Infinity;
                    return (((nc.days * 24 + nc.hours) * 60 + nc.minutes) * 60 + nc.seconds) * 1000;
                  })();
                  const showJoin = ev.id === nearestId && !!ev.meeting_link && (isActive || remainingMs <= 10 * 60 * 1000);
                  if (showJoin) {
                    return (
                      <Button size="sm" className="gap-2" variant={'outline'} asChild>
                        <a href={ev.meeting_link as string} target="_blank" rel="noopener noreferrer">
                          <Icon icon="fluent:live-20-filled" className="h-4 w-4" /> Transmisión en vivo
                        </a>
                      </Button>
                    );
                  }
                  return (
                    <>
                      <Button size="sm" variant="outline" onClick={() => downloadICS(ev)} className="gap-2">
                        <Icon icon="mdi:calendar-plus" className="h-4 w-4" /> Agregar al calendario
                      </Button>
                      {(() => {
                        const loc: any = (ev as any)?.location;
                        const lat = typeof loc === 'object' ? loc?.latitude : undefined;
                        const lon = typeof loc === 'object' ? loc?.longitude : undefined;
                        const hasLinks = typeof loc === 'object' && (loc?.waze_link || loc?.googleMaps_link);
                        const canShow = (!!lat && !!lon) || hasLinks;
                        return canShow ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="link" className="gap-2">
                                <Icon icon="mdi:map-marker" className="h-4 w-4" /> Cómo llegar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-xl md:max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-slate-200/50 bg-white/20 backdrop-blur-2xl shadow-xl p-4 sm:p-6">
                              <DialogHeader>
                                <DialogTitle>Ubicación</DialogTitle>
                                {typeof loc === 'object' && (loc?.name || loc?.address) ? (
                                  <DialogDescription>
                                    {[loc?.name, loc?.address].filter(Boolean).join(' · ')}
                                  </DialogDescription>
                                ) : null}
                              </DialogHeader>
                              <div className="w-full">
                                {lat && lon ? (
                                  <div className="w-full h-64 overflow-hidden rounded-md border">
                                    <iframe
                                      title="Mapa"
                                      className="w-full h-full"
                                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(lon - 0.005).toFixed(6)}%2C${(lat - 0.003).toFixed(6)}%2C${(lon + 0.005).toFixed(6)}%2C${(lat + 0.003).toFixed(6)}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lon.toFixed(6)}`}
                                    />
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-600">No hay coordenadas disponibles para mostrar el mapa.</p>
                                )}
                              </div>
                              <DialogFooter className="flex gap-2 justify-end">
                                {(() => {
                                  function buildWazeLink() {
                                    if (typeof loc === 'object' && loc?.waze_link) return loc.waze_link as string;
                                    if (lat && lon) return `https://waze.com/ul?ll=${lat},${lon}&navigate=yes`;
                                    return '';
                                  }
                                  function buildGoogleLink() {
                                    if (typeof loc === 'object' && loc?.googleMaps_link) return loc.googleMaps_link as string;
                                    if (lat && lon) return `https://www.google.com/maps?q=${lat},${lon}`;
                                    return '';
                                  }
                                  const waze = buildWazeLink();
                                  const gmaps = buildGoogleLink();
                                  return (
                                    <>
                                      {waze ? (
                                        <a href={waze} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border bg-white hover:bg-slate-50">
                                          <Icon icon="fa7-brands:waze" className="h-4 w-4" /> Dirección con Waze
                                        </a>
                                      ) : null}
                                      {gmaps ? (
                                        <a href={gmaps} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border bg-white hover:bg-slate-50">
                                          <Icon icon="mdi:map-marker" className="h-4 w-4" /> Dirección con Google Maps
                                        </a>
                                      ) : null}
                                    </>
                                  );
                                })()}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : null;
                      })()}
                    </>
                  );
                })()}
              </div>
            </CardContent>
            {nearestId === ev.id && (() => {
              const start = ev.start_datetime ? new Date(ev.start_datetime) : null;
              const end = ev.end_datetime ? new Date(ev.end_datetime) : null;
              const active = !!(start && end && now >= start && now < end);
              const label = active ? 'Evento en curso' : 'Próximo evento';
              return (
                <CardFooter className="p-0">
                  <div className="w-full text-card-foreground text-center text-xs font-medium py-2 border-t border-slate-200/50 bg-white/20 backdrop-blur-2xl shadow-lg">
                    {label}
                  </div>
                </CardFooter>
              );
            })()}
          </Card>
        );
      })}
    </div>
  );
}
