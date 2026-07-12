import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookingPageUrl } from '../utils/bookingUrls';

// ─────────────────────────────────────────────
// Thailand time helpers (UTC+7, no DST)
// ─────────────────────────────────────────────
const THAI_OFFSET_MS = 7 * 3600 * 1000;

/** Returns a Date whose UTC parts represent current Thailand local time */
const thaiNow = () => new Date(Date.now() + THAI_OFFSET_MS);

/** 'YYYY-MM-DD' string in Thailand time */
const thaiDateStr = (d = thaiNow()) => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Next Thailand midnight in real UTC ms (for scheduling a refresh timer) */
const msUntilThaiMidnight = () => {
  const now = thaiNow();
  const tomorrowThaiMidnight = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
  ) - THAI_OFFSET_MS;
  return Math.max(0, tomorrowThaiMidnight - Date.now());
};

// ─────────────────────────────────────────────
// Compute Auto event from weekly schedules + daily image overrides
// Returns: { eventName, eventDate, eventImage, eventStadiumId, countdownTo } | null
// ─────────────────────────────────────────────
const computeAutoEvent = (stadiumImageSchedules, stadiumId, dailyImages) => {
  if (!stadiumImageSchedules || !stadiumId) return null;
  const stSchedules = stadiumImageSchedules[stadiumId] || [];
  if (!stSchedules.length) return null;

  const allDays = [...new Set(stSchedules.flatMap(s => s.days || []))];
  if (!allDays.length) return null;

  // Scan up to 14 days starting from today (Thailand time)
  const base = thaiNow();
  for (let i = 0; i < 14; i++) {
    // Add i days to base Thailand date (using UTC since we shifted by +7h)
    const d = new Date(Date.UTC(
      base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + i
    ));
    const dow = d.getUTCDay(); // day of week (0=Sun … 6=Sat) in Thailand time
    if (!allDays.includes(dow)) continue;

    const dateStr = thaiDateStr(d);
    const schedule = stSchedules.find(s => (s.days || []).includes(dow));
    if (!schedule) continue;

    // Check if there's a daily image override (แก้ไขภาพประจำวัน) for this date
    const dailyOverride = Array.isArray(dailyImages)
      ? dailyImages.find(img => img.stadiumId === stadiumId && img.date === dateStr)
      : null;

    // Countdown target: 20:30 Thailand time = 13:30 UTC
    const countdownTo = `${dateStr}T13:30:00Z`;

    return {
      eventDate: dateStr,
      eventName: dailyOverride?.name || schedule.name || '',
      eventImage: dailyOverride?.image || schedule.image || '',
      eventStadiumId: stadiumId,
      matchCardId: null,
      countdownTo,
    };
  }
  return null;
};

// ─────────────────────────────────────────────
// Countdown hook — returns { days, hours, minutes, seconds, expired }
// ─────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');

const useCountdown = (isoTarget) => {
  const calc = () => {
    if (!isoTarget) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    const diff = new Date(isoTarget).getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  };
  const [timeLeft, setTimeLeft] = useState(calc);
  useEffect(() => {
    if (!isoTarget) return;
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return timeLeft;
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const UpcomingFightBanner = ({ banner, stadiumImageSchedules, dailyImages }) => {
  const navigate = useNavigate();

  // For auto mode: refresh state at midnight Thailand time (switches to next event day)
  const [midnightKey, setMidnightKey] = useState(0);
  useEffect(() => {
    if (!banner?.isAuto) return;
    const schedule = () => {
      const ms = msUntilThaiMidnight();
      const t = setTimeout(() => {
        setMidnightKey(k => k + 1);
        schedule(); // re-arm for the following midnight
      }, ms);
      return t;
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, [banner?.isAuto]);

  // Resolve the event to display
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const event = useMemo(() => {
    if (!banner) return null;
    if (banner.isAuto) {
      return computeAutoEvent(stadiumImageSchedules, banner.targetId, dailyImages);
    }
    // Manual mode — use stored event fields
    if (!banner.eventName && !banner.eventDate && !banner.eventImage) return null;
    return {
      eventName:      banner.eventName || '',
      eventDate:      banner.eventDate || '',
      eventImage:     banner.eventImage || '',
      eventStadiumId: banner.eventStadiumId || '',
      matchCardId:    banner.matchCardId || null,
      countdownTo:    banner.countdownTo || null,
    };
  // midnightKey forces recompute at midnight for auto mode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner, stadiumImageSchedules, midnightKey]);

  const cd = useCountdown(event?.countdownTo);

  // ── Visibility rules ──
  if (!banner || !banner.isVisible) return null;
  if (!event) return null;

  // Manual mode: hide when countdown expires
  if (!banner.isAuto && cd.expired) return null;

  // Auto mode: never hide on countdown expire (shows 00:00:00:00 until midnight switch)

  const formattedDate = (() => {
    if (!event.eventDate) return '';
    try {
      return new Date(event.eventDate + 'T12:00:00Z')
        .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        .toUpperCase();
    } catch { return event.eventDate; }
  })();

  const handleBuyTicket = () => {
    if (!event.eventStadiumId) return;
    const params = { date: event.eventDate, step: 'payment' };
    if (event.matchCardId) params.matchCardId = String(event.matchCardId);
    navigate(getBookingPageUrl(event.eventStadiumId, params));
  };

  const units = [
    { value: cd.days,    label: 'Days' },
    { value: cd.hours,   label: 'Hours' },
    { value: cd.minutes, label: 'Minutes' },
    { value: cd.seconds, label: 'Seconds' },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #07111f 0%, #0c1e3a 55%, #07111f 100%)' }}
    >
      {/* faint diagonal grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
        {/*
          Mobile / tablet : poster on top, info below (stacked)
          Desktop (≥ lg)  : info left | poster right
        */}
        <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-14 xl:gap-20">

          {/* ── Poster — top on mobile/tablet, right on desktop ── */}
          {event.eventImage && (
            <div className="order-first lg:order-last flex-shrink-0 flex justify-center w-full lg:w-auto">
              <img
                src={event.eventImage}
                alt={event.eventName || 'Upcoming Fight'}
                className="
                  rounded-2xl object-contain
                  shadow-[0_20px_60px_rgba(0,0,0,0.7)]
                  w-full
                  max-w-[320px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[440px] xl:max-w-[520px]
                  max-h-[340px]  sm:max-h-[440px]  md:max-h-[520px]  lg:max-h-[560px]  xl:max-h-[620px]
                "
              />
            </div>
          )}

          {/* ── Info ── */}
          <div className="flex-1 w-full text-center lg:text-left">

            {/* Label */}
            <p className="text-yellow-400 font-bold uppercase tracking-[0.3em] text-xs sm:text-sm lg:text-base mb-3 sm:mb-4">
              Up Coming Fight
            </p>

            {/* Title */}
            <h2 className="
              text-white font-black uppercase leading-tight
              text-2xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-5xl
              mb-2 sm:mb-3
            ">
              {event.eventName}
            </h2>

            {/* Date */}
            <p className="text-gray-300 uppercase tracking-wider text-sm sm:text-base md:text-lg mb-6 sm:mb-8 lg:mb-10">
              {formattedDate}
            </p>

            {/* ── Countdown or LIVE NOW ── */}
            {cd.expired ? (
              /* Auto mode after 20:30 → show LIVE NOW badge (manual mode never reaches here) */
              <div className="mb-6 sm:mb-8 lg:mb-10 mx-auto lg:mx-0 max-w-[340px] sm:max-w-[480px] lg:max-w-none">
                <div className="inline-flex items-center gap-3 bg-red-600/20 border-2 border-red-500 rounded-xl px-6 sm:px-10 py-4 sm:py-5">
                  {/* pulsing dot */}
                  <span className="relative flex h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-red-500" />
                  </span>
                  <span className="text-red-400 font-black uppercase tracking-widest text-xl sm:text-2xl md:text-3xl">
                    Live Now
                  </span>
                </div>
              </div>
            ) : (
              <div className="
                grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-6 sm:mb-8 lg:mb-10
                mx-auto lg:mx-0
                max-w-[340px] sm:max-w-[480px] md:max-w-[560px] lg:max-w-none
              ">
                {units.map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 sm:gap-2">
                    <div className="w-full bg-yellow-500 rounded-lg flex items-center justify-center py-3 sm:py-4 md:py-5 lg:py-6">
                      <span className="
                        text-black font-black tabular-nums leading-none
                        text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl
                      ">
                        {pad(value)}
                      </span>
                    </div>
                    <span className="text-gray-400 uppercase tracking-widest text-[10px] sm:text-xs lg:text-sm">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            {event.eventStadiumId && (
              <button
                onClick={handleBuyTicket}
                className="
                  bg-red-600 hover:bg-red-500 active:bg-red-700
                  text-white font-black uppercase tracking-widest
                  px-8 sm:px-12 py-3 sm:py-4
                  text-sm sm:text-base lg:text-lg
                  rounded transition-colors duration-200
                  shadow-xl shadow-red-900/50
                "
              >
                Buy Ticket Now
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default UpcomingFightBanner;
