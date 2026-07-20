import { motion } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import HeroPanel from '../components/dashboard/HeroPanel'
import WaterFlowChart from '../components/dashboard/WaterFlowChart'
import PowerConsumptionChart from '../components/dashboard/PowerConsumptionChart'
import GrowthRateChart from '../components/dashboard/GrowthRateChart'
import CO2Chart from '../components/dashboard/CO2Chart'
<<<<<<< HEAD
import DashMetricCard from '../components/dashboard/DashMetricCard'
import type { CardStatus } from '../components/dashboard/DashMetricCard'
import type { InternalData, ExternalData } from '../types'

// ── Greenhouse image ──────────────────────────────────────────────────────────
const HERO_IMAGE = 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?auto=format&fit=crop&w=1400&q=80'

// ── Status helpers ────────────────────────────────────────────────────────────
function cs(
  v: number | null | undefined,
  okLow: number, okHigh: number,
  critLow?: number, critHigh?: number,
): CardStatus {
  if (v == null) return 'info'
  if (critLow  !== undefined && v < critLow)  return 'critical'
  if (critHigh !== undefined && v > critHigh) return 'critical'
  if (v < okLow || v > okHigh) return 'warning'
  return 'ok'
}

const intStatus = (d: InternalData | null) => ({
  temperature: cs(d?.temperature,  18,   23,   15,   27),
  humidity:    cs(d?.humidity,      65,   80,   55,   88),
  co2:         cs(d?.co2,          700, 1100,  500, 1300),
  voc:         cs(d?.voc,            0,  200, undefined, 300),
  vpd:         cs(d?.vpd,          0.5,  1.2, undefined, 1.5),
  pressure:    cs(d?.pressure,     980, 1040),
  dew_point:   cs(d?.dew_point, -9999,   16, undefined,  20),
})

const extStatus = (d: ExternalData | null) => ({
  radiation:   'info' as CardStatus,
  wind_speed:  cs(d?.wind_speed,    0,   25, undefined, 40),
  temperature: cs(d?.temperature,   8,   35,    3,       40),
  humidity:    'info' as CardStatus,
  rain:        cs(d?.rain,          0,    5, undefined,  15),
  battery_v:   cs(d?.battery_v,   3.5,  99,  3.3),
})

// ── Inline SVG icons (14×14) ──────────────────────────────────────────────────
const I = {
  thermo: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a2 2 0 0 0-2 2v9.17A4 4 0 1 0 14 14V5a2 2 0 0 0-2-2Z" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="2" fill={c} opacity=".8"/>
    </svg>
  ),
  drop: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 11 5 15.5a7 7 0 0 0 14 0C19 11 12 3 12 3Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  ),
  co2: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={c} strokeWidth="1.8"/>
      <text x="12" y="16" textAnchor="middle" fill={c} fontSize="6.5" fontWeight="800" fontFamily="monospace">CO₂</text>
    </svg>
  ),
  wind: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3 8h10a3 3 0 1 0-3-3M3 12h14a3 3 0 1 1-3 3M3 16h8" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  vpd: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M5 17a7 7 0 1 1 14 0" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 10l-2 5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1.5" fill={c}/>
    </svg>
  ),
  pressure: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.8"/>
      <path d="M12 8v4l2.5 2.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  dewpoint: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M8 14s0-6 4-9c4 3 4 9 4 9a4 4 0 0 1-8 0Z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 21v2M6 18l-2 2M18 18l2 2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  sun: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke={c} strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  rain: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2" stroke={c} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  battery: (c: string) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="18" height="10" rx="2" stroke={c} strokeWidth="1.8"/>
      <path d="M22 11v2" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
      <rect x="4" y="9" width="10" height="6" rx="1" fill={c} opacity=".6"/>
    </svg>
  ),
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({
  emoji, title, color, source, okCount, total, lastUpdate,
}: {
  emoji: string; title: string; color: string
  source?: string; okCount: number; total: number; lastUpdate?: Date | null
}) {
  const pct = total > 0 ? Math.round((okCount / total) * 100) : 0
  const statusColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 16px 11px',
      borderBottom: `1px solid rgba(0,0,0,0.06)`,
      background: `linear-gradient(135deg, ${color}07 0%, transparent 100%)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Colored icon badge */}
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `1.5px solid ${color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>
          {emoji}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0A0909', letterSpacing: '-0.02em' }}>
            {title}
          </div>
          {source && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981',
                animation: 'livePulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 10, color: '#729C51', fontWeight: 600 }}>
                {source === 'station' ? '📡 Station physique' : '⚙️ Simulation'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Health score */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: `${statusColor}10`, border: `1px solid ${statusColor}25`,
          borderRadius: 10, padding: '5px 10px',
        }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: statusColor, lineHeight: 1 }}>
            {okCount}/{total}
          </span>
          <span style={{ fontSize: 9, color: statusColor, fontWeight: 600, marginTop: 1 }}>Optimaux</span>
        </div>

        {/* Last update */}
        {lastUpdate && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: '#9EAAB5', fontWeight: 500 }}>Actualisé</div>
            <div style={{ fontSize: 10, color: '#6B7A8D', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {lastUpdate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Conditions strip ──────────────────────────────────────────────────────────
function Badge({ ok, label, value }: { ok: boolean | null; label: string; value: string }) {
  const c = ok === null ? '#94a3b8' : ok ? '#10b981' : '#ef4444'
  const bg = ok === null ? 'rgba(148,163,184,0.08)' : ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'
  const border = ok === null ? 'rgba(148,163,184,0.18)' : ok ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 8, padding: '5px 10px',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
      <span style={{ fontSize: 10.5, color: '#5A6A7A', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: c }}>{value}</span>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { internal, external, loading, lastUpdate } = useLatestSensorData(30000)

  // ── Computed status objects ─────────────────────────────────────────────────
  const iS = intStatus(internal)
  const eS = extStatus(external)

  // ── Count optimals ──────────────────────────────────────────────────────────
  const intVals   = Object.values(iS) as CardStatus[]
  const extVals   = Object.values(eS) as CardStatus[]
  const intOk     = intVals.filter(s => s === 'ok').length
  const intTotal  = intVals.filter(s => s !== 'info').length
  const extOk     = extVals.filter(s => s === 'ok').length
  const extTotal  = extVals.filter(s => s !== 'info').length

  // ── Null-safe display helpers ───────────────────────────────────────────────
  const iv = internal  // shorthand
  const ev = external

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 1 — Hero panel + side charts
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 272px',
        gap: 14,
        minHeight: 310,
      }}>
        <HeroPanel imageUrl={HERO_IMAGE} />

        {/* Right: stacked charts */}
=======
import MetricMiniCard from '../components/dashboard/MetricMiniCard'

// ── Icons for metric cards ──────────────────────────────────────────────────
function ThermoIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a2 2 0 0 0-2 2v9.17A4 4 0 1 0 14 14V5a2 2 0 0 0-2-2Z" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="17" r="2" fill={color} opacity="0.8"/>
    </svg>
  )
}
function DropletIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3C12 3 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-12-7-12Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  )
}
function SunIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
function LeafIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.06A1 1 0 0 0 5 20.54c3.13-.92 7-2.9 9.36-6.15C15.17 13.3 16.43 11.35 17 8Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M3 21c2.5-2 4.83-5 6-8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}

// Greenhouse background image — hydroponic rows interior
const HERO_IMAGE = 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?auto=format&fit=crop&w=1400&q=80'

export default function DashboardPage() {
  const { internal } = useLatestSensorData(30000)

  const temp     = internal?.temperature != null ? internal.temperature.toFixed(1) : '23'
  const humidity = internal?.humidity     != null ? Math.round(internal.humidity)  : '68'
  const co2      = internal?.co2          != null ? Math.round(internal.co2)       : 900

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>

      {/* ── TOP ROW: Hero + Right charts ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 14,
        minHeight: 330,
      }}>
        {/* Hero panel */}
        <HeroPanel imageUrl={HERO_IMAGE} />

        {/* Right charts column */}
>>>>>>> 1864d0def4dfa5b590a25dafa2adbba09332eec9
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <WaterFlowChart />
          <PowerConsumptionChart />
        </div>
      </div>

<<<<<<< HEAD
      {/* ════════════════════════════════════════════════════════════════════
          ROW 2 — Internal vs External data, side by side
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        alignItems: 'start',
      }}>

        {/* ── Left: SERRE INTÉRIEURE ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 14px rgba(0,0,0,0.065)',
            border: '1px solid rgba(114,156,81,0.14)',
            overflow: 'hidden',
          }}
        >
          <SectionHeader
            emoji="🌿"
            title="Serre Intérieure"
            color="#729C51"
            source={iv?.source}
            okCount={intOk}
            total={intTotal}
            lastUpdate={lastUpdate}
          />

          {/* 4-column card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            padding: '14px 14px 10px',
          }}>
            <DashMetricCard
              label="Température"
              value={iv?.temperature ?? null}
              unit="°C"
              icon={I.thermo('#f97316')}
              color="#f97316"
              status={iS.temperature}
              hint="18–23 °C"
              precision={1}
              delay={0.12}
            />
            <DashMetricCard
              label="Humidité"
              value={iv?.humidity ?? null}
              unit="%"
              icon={I.drop('#06b6d4')}
              color="#06b6d4"
              status={iS.humidity}
              hint="65–80 %"
              precision={0}
              delay={0.16}
            />
            <DashMetricCard
              label="CO₂"
              value={iv?.co2 ?? null}
              unit="ppm"
              icon={I.co2('#3b82f6')}
              color="#3b82f6"
              status={iS.co2}
              hint="700–1100"
              precision={0}
              delay={0.20}
            />
            <DashMetricCard
              label="VOC"
              value={iv?.voc ?? null}
              unit="ppb"
              icon={I.wind('#a855f7')}
              color="#a855f7"
              status={iS.voc}
              hint="< 200 ppb"
              precision={0}
              delay={0.24}
            />
            <DashMetricCard
              label="VPD"
              value={iv?.vpd ?? null}
              unit="kPa"
              icon={I.vpd('#10b981')}
              color="#10b981"
              status={iS.vpd}
              hint="0.5–1.2"
              precision={2}
              delay={0.28}
            />
            <DashMetricCard
              label="Pression"
              value={iv?.pressure ?? null}
              unit="hPa"
              icon={I.pressure('#f59e0b')}
              color="#f59e0b"
              status={iS.pressure}
              hint="980–1040"
              precision={0}
              delay={0.32}
            />
            <DashMetricCard
              label="Pt. Rosée"
              value={iv?.dew_point ?? null}
              unit="°C"
              icon={I.dewpoint('#64748b')}
              color="#64748b"
              status={iS.dew_point}
              hint="< 16 °C"
              precision={1}
              delay={0.36}
            />
            {/* VPD Partiel (partial vapor pressure) if available */}
            <DashMetricCard
              label="Pression Vap."
              value={iv?.partial_vapor_pressure ?? null}
              unit="kPa"
              icon={I.drop('#8b5cf6')}
              color="#8b5cf6"
              status="info"
              hint="Pression partielle"
              precision={2}
              delay={0.40}
            />
          </div>

          {/* Conditions optimales strip */}
          <div style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#9EAAB5',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
            }}>
              Conditions optimales — Fraisier 🍓
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Badge
                ok={iv ? iv.temperature >= 18 && iv.temperature <= 23 : null}
                label="Temp."
                value={iv ? `${iv.temperature.toFixed(1)} °C` : '—'}
              />
              <Badge
                ok={iv ? iv.humidity >= 65 && iv.humidity <= 80 : null}
                label="Humidité"
                value={iv ? `${Math.round(iv.humidity)} %` : '—'}
              />
              <Badge
                ok={iv ? iv.co2 >= 700 && iv.co2 <= 1100 : null}
                label="CO₂"
                value={iv ? `${Math.round(iv.co2)} ppm` : '—'}
              />
              <Badge
                ok={iv ? iv.vpd >= 0.5 && iv.vpd <= 1.2 : null}
                label="VPD"
                value={iv ? `${iv.vpd.toFixed(2)} kPa` : '—'}
              />
              <Badge
                ok={iv ? iv.voc < 200 : null}
                label="VOC"
                value={iv ? `${Math.round(iv.voc)} ppb` : '—'}
              />
            </div>
          </div>
        </motion.div>

        {/* ── Right: MÉTÉO EXTÉRIEURE ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 2px 14px rgba(0,0,0,0.065)',
            border: '1px solid rgba(249,115,22,0.14)',
            overflow: 'hidden',
          }}
        >
          <SectionHeader
            emoji="🌤️"
            title="Météo Extérieure"
            color="#f97316"
            source={ev?.source}
            okCount={extOk}
            total={extTotal}
            lastUpdate={lastUpdate}
          />

          {/* 3-column card grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            padding: '14px 14px 10px',
          }}>
            <DashMetricCard
              label="Irradiance"
              value={ev?.radiation ?? null}
              unit="W/m²"
              icon={I.sun('#f97316')}
              color="#f97316"
              status="info"
              hint="Énergie solaire"
              precision={0}
              delay={0.20}
            />
            <DashMetricCard
              label="Vent"
              value={ev?.wind_speed ?? null}
              unit="km/h"
              icon={I.wind('#06b6d4')}
              color="#06b6d4"
              status={eS.wind_speed}
              hint="< 25 km/h"
              precision={1}
              delay={0.24}
            />
            <DashMetricCard
              label="Temp. Ext."
              value={ev?.temperature ?? null}
              unit="°C"
              icon={I.thermo('#f59e0b')}
              color="#f59e0b"
              status={eS.temperature}
              hint="8–35 °C"
              precision={1}
              delay={0.28}
            />
            <DashMetricCard
              label="Précipitations"
              value={ev?.rain ?? null}
              unit="mm"
              icon={I.rain('#3b82f6')}
              color="#3b82f6"
              status={eS.rain}
              hint="0–5 mm"
              precision={1}
              delay={0.32}
            />
            <DashMetricCard
              label="Humidité Ext."
              value={ev?.humidity ?? null}
              unit="%"
              icon={I.drop('#0ea5e9')}
              color="#0ea5e9"
              status="info"
              hint="Ambiance ext."
              precision={0}
              delay={0.36}
            />
            <DashMetricCard
              label="Batterie"
              value={ev?.battery_v ?? null}
              unit="V"
              icon={I.battery('#10b981')}
              color="#10b981"
              status={eS.battery_v}
              hint="> 3.5 V"
              precision={2}
              delay={0.40}
            />
          </div>

          {/* Impact météo strip */}
          <div style={{
            padding: '10px 14px 14px',
            borderTop: '1px solid rgba(0,0,0,0.05)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#9EAAB5',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7,
            }}>
              Impact sur la serre 🏡
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Badge
                ok={ev ? ev.radiation >= 100 : null}
                label="Soleil"
                value={ev ? `${Math.round(ev.radiation)} W/m²` : '—'}
              />
              <Badge
                ok={ev ? ev.wind_speed < 25 : null}
                label="Vent"
                value={ev ? `${ev.wind_speed.toFixed(1)} km/h` : '—'}
              />
              <Badge
                ok={ev ? (ev.rain ?? 0) < 2 : null}
                label="Pluie"
                value={ev ? `${(ev.rain ?? 0).toFixed(1)} mm` : '—'}
              />
              <Badge
                ok={ev ? ev.temperature >= 8 && ev.temperature <= 35 : null}
                label="Temp. ext."
                value={ev ? `${ev.temperature.toFixed(1)} °C` : '—'}
              />
              {ev?.wind_cardinal && (
                <Badge
                  ok={null}
                  label="Direction"
                  value={ev.wind_cardinal}
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          ROW 3 — Charts: CO2 trend + Growth rate
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
        minHeight: 220,
      }}>
        <CO2Chart liveData={internal} />
        <GrowthRateChart />
      </div>

      {/* Pulse dot animation */}
      <style>{`
        @keyframes livePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.75); }
        }
      `}</style>
=======
      {/* ── BOTTOM ROW: Metric cards + Growth Rate + CO2 ─────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr 240px',
        gap: 14,
        minHeight: 220,
      }}>
        {/* 2×2 Metric cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            alignContent: 'start',
          }}
        >
          <MetricMiniCard
            label="Indoor Climate"
            value={temp}
            unit="°C"
            icon={<ThermoIcon color="#f97316" />}
            color="#f97316"
            delay={0.35}
          />
          <MetricMiniCard
            label="Air Moisture"
            value={humidity}
            unit="%"
            icon={<DropletIcon color="#06b6d4" />}
            color="#06b6d4"
            delay={0.4}
          />
          <MetricMiniCard
            label="Light Level"
            value="15"
            unit="H"
            icon={<SunIcon color="#eab308" />}
            color="#eab308"
            delay={0.45}
          />
          <MetricMiniCard
            label="EC Level"
            value="2.1"
            unit="mS"
            icon={<LeafIcon color="#729C51" />}
            color="#729C51"
            delay={0.5}
          />
        </motion.div>

        {/* Growth Rate chart */}
        <GrowthRateChart />

        {/* CO2 chart */}
        <CO2Chart liveData={internal} />
      </div>
>>>>>>> 1864d0def4dfa5b590a25dafa2adbba09332eec9
    </div>
  )
}
