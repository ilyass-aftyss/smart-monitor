/**
 * Page Historique — données réelles uniquement
 * Onglet Intérieur : capteur HD50
 * Onglet Extérieur : station météo + capteur solaire
 */
import { useMemo, useState, useEffect } from "react"
import {
  Area, AreaChart, Bar, BarChart, Line, LineChart,
  CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import {
  Thermometer, Droplets, Sparkles, Sun, Wind, CloudRain,
  Gauge, Lightbulb, Calendar, Download, Leaf, RefreshCw,
} from "lucide-react"
import { internalApi, externalApi, historyApi } from "../services/api"
import type { InternalData, ExternalData } from "../types"

/* ─── types ──────────────────────────────────────────────────────────────── */

const RANGES = ["24h", "7j", "30j"] as const
type Range  = (typeof RANGES)[number]
type TabKey = "interior" | "exterior"

interface SeriesPoint { time: string; value: number | null }

const hoursMap: Record<Range, number> = { "24h": 24, "7j": 168, "30j": 720 }
const limitMap: Record<Range, number> = { "24h": 2000, "7j": 3000, "30j": 5000 }

/* ─── helpers ────────────────────────────────────────────────────────────── */

function fmtTime(ts: string, range: Range): string {
  try {
    const d = new Date(ts)
    if (range === "24h")
      return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit",
      hour: "2-digit", minute: "2-digit",
    })
  } catch { return ts }
}

function toPoint(data: any[], key: string, range: Range): SeriesPoint[] {
  if (!data?.length) return []
  return data.map((d: any) => {
    const raw = d[key]
    const v   = raw != null ? parseFloat(parseFloat(String(raw)).toFixed(2)) : null
    return { time: fmtTime(d.timestamp, range), value: isNaN(v as number) ? null : v }
  })
}

function lastVal(arr: SeriesPoint[]): number | null {
  for (let i = arr.length - 1; i >= 0; i--)
    if (arr[i].value != null) return arr[i].value!
  return null
}

function fv(v: number | null, dec = 1): string {
  return v != null ? v.toFixed(dec) : "—"
}

/* ─── tooltip style ──────────────────────────────────────────────────────── */

const tooltipStyle = {
  background: "oklch(1 0 0 / 92%)",
  border: "1px solid oklch(0.88 0.02 150)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px oklch(0.2 0.03 150 / 12%)",
  backdropFilter: "blur(12px)",
} as const

/* ─── ChartCard ──────────────────────────────────────────────────────────── */

interface ChartCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
  data: SeriesPoint[]
  color: string
  kind: "area" | "line" | "bar"
  unit?: string
  className?: string
}

function ChartCard({
  icon: Icon, label, value, accent, data, color, kind, unit = "", className = "",
}: ChartCardProps) {
  const hasData = data.some((p) => p.value != null)

  return (
    <div className={`glass-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-medium text-foreground/80">{label}</span>
        </div>
        <span className="text-lg font-black tracking-tight text-foreground whitespace-nowrap">{value}</span>
      </div>

      {unit && (
        <div className="mb-1 ml-9 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          {unit}
        </div>
      )}

      <div className="mt-2 h-44 w-full">
        {!hasData ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <span className="text-xs">Aucune donnée sur la période</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {kind === "area" ? (
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} width={42} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${unit}`, label]} />
                <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                  fill={`url(#g-${label})`} connectNulls dot={false} />
              </AreaChart>
            ) : kind === "line" ? (
              <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} width={42} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${unit}`, label]} />
                <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2}
                  dot={false} connectNulls />
              </LineChart>
            ) : (
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: "oklch(0.5 0.02 150)" }} width={42} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${unit}`, label]} />
                <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

/* ─── Empty state ────────────────────────────────────────────────────────── */

function EmptyState({ range }: { range: Range }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Calendar className="h-10 w-10 opacity-30" />
      <p className="text-sm font-medium">Aucune donnée pour les {range}</p>
      <p className="text-xs font-mono opacity-60">
        La station envoie une mesure toutes les ~20 s — revenez dans quelques instants
      </p>
    </div>
  )
}

/* ─── Section header ─────────────────────────────────────────────────────── */

function SectionHeader({
  icon, title, count, latestTs,
}: {
  icon: React.ReactNode; title: string; count: number; latestTs?: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/80 shadow-sm text-primary">
        {icon}
      </span>
      <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary font-mono">
        {count} mesures
      </span>
      {latestTs && (
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-mono text-emerald-700">
          dernière : {latestTs}
        </span>
      )}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function HistoryPage() {
  const [range,    setRange]    = useState<Range>("24h")
  const [tab,      setTab]      = useState<TabKey>("interior")
  const [intData,  setIntData]  = useState<InternalData[]>([])
  const [extData,  setExtData]  = useState<ExternalData[]>([])
  const [loading,  setLoading]  = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setLoading(true)
    const h = hoursMap[range]
    const l = limitMap[range]
    Promise.all([
      internalApi.history(h, l),
      externalApi.history(h, l),
    ])
      .then(([i, e]) => {
        setIntData(i.data ?? [])
        setExtData(e.data ?? [])
      })
      .catch(() => {
        setIntData([])
        setExtData([])
      })
      .finally(() => setLoading(false))
  }, [range])

  /* Build chart series directly from real data */
  const series = useMemo(() => ({
    // Interior — HD50
    indoorTemp:  toPoint(intData, "temperature",           range),
    indoorHum:   toPoint(intData, "humidity",              range),
    co2:         toPoint(intData, "co2",                   range),
    lux:         toPoint(intData, "illuminance",           range),
    pressure:    toPoint(intData, "pressure",              range),
    dewPoint:    toPoint(intData, "dew_point",             range),
    partialVap:  toPoint(intData, "partial_vapor_pressure", range),
    // Exterior — Météo + Solaire
    outdoorTemp: toPoint(extData, "temperature",           range),
    outdoorHum:  toPoint(extData, "humidity",              range),
    wind:        toPoint(extData, "wind_speed",            range),
    rain:        toPoint(extData, "rain",                  range),
    irradiance:  toPoint(extData, "radiation",             range),
    batteryV:    toPoint(extData, "battery_v",             range),
  }), [intData, extData, range])

  /* Latest timestamp displayed per section */
  function latestFmt(data: (InternalData | ExternalData)[]): string | undefined {
    if (!data.length) return undefined
    try {
      const ts = data[data.length - 1]?.timestamp
      return ts ? new Date(String(ts).replace(" ", "T")).toLocaleTimeString("fr-FR", {
        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      }) : undefined
    } catch { return undefined }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await historyApi.exportCsv()
      const url  = URL.createObjectURL(res.data)
      const link = document.createElement("a")
      link.href     = url
      link.download = `historique-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export CSV:", err)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Historique
          </h1>
          <p className="text-sm text-muted-foreground">
            {!loading && (intData.length + extData.length > 0)
              ? `${intData.length} mesures intérieures · ${extData.length} mesures extérieures`
              : "Données temps réel depuis la station physique"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || (intData.length + extData.length === 0)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Préparation…" : "Télécharger CSV"}
          </button>

          <div className="glass-card flex items-center gap-1 p-1">
            <span className="grid h-8 w-8 place-items-center text-muted-foreground">
              <Calendar className="h-4 w-4" />
            </span>
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:bg-white/60"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-border/40">
        {([
          {
            key: "interior" as TabKey,
            icon: <Leaf className="h-4 w-4" />,
            label: "Intérieur — HD50",
            count: intData.length,
          },
          {
            key: "exterior" as TabKey,
            icon: <Sun className="h-4 w-4" />,
            label: "Extérieur — Météo + Solaire",
            count: extData.length,
          },
        ]).map(({ key, icon, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border border-b-0 -mb-px ${
              tab === key
                ? "bg-white border-border/40 text-primary shadow-sm"
                : "bg-transparent border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            {label}
            {count > 0 && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono text-primary">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Chargement de l'historique…
        </div>
      )}

      {/* ── Intérieur ── */}
      {!loading && tab === "interior" && (
        <>
          {intData.length === 0 ? (
            <EmptyState range={range} />
          ) : (
            <>
              <SectionHeader
                icon={<Leaf className="h-4 w-4" />}
                title="Capteur HD50 — Climat intérieur serre"
                count={intData.length}
                latestTs={latestFmt(intData)}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard
                  icon={Thermometer} label="Température intérieure"
                  value={`${fv(lastVal(series.indoorTemp))} °C`} unit="°C"
                  accent="text-orange-500" data={series.indoorTemp}
                  color="#EF4444" kind="area" className="lg:col-span-2"
                />
                <ChartCard
                  icon={Droplets} label="Humidité intérieure"
                  value={`${fv(lastVal(series.indoorHum))} %`} unit="%"
                  accent="text-sky-600" data={series.indoorHum}
                  color="#3B82F6" kind="area"
                />
                <ChartCard
                  icon={Sparkles} label="CO₂"
                  value={`${fv(lastVal(series.co2), 0)} ppm`} unit="ppm"
                  accent="text-emerald-600" data={series.co2}
                  color="#10B981" kind="bar"
                />
                <ChartCard
                  icon={Lightbulb} label="Illuminance"
                  value={`${fv(lastVal(series.lux), 0)} lux`} unit="lux"
                  accent="text-amber-500" data={series.lux}
                  color="#F59E0B" kind="area"
                />
                <ChartCard
                  icon={Gauge} label="Pression atmosphérique"
                  value={`${fv(lastVal(series.pressure))} hPa`} unit="hPa"
                  accent="text-indigo-500" data={series.pressure}
                  color="#6366F1" kind="line"
                />
                <ChartCard
                  icon={Droplets} label="Point de rosée"
                  value={`${fv(lastVal(series.dewPoint))} °C`} unit="°C"
                  accent="text-cyan-600" data={series.dewPoint}
                  color="#06B6D4" kind="line"
                />
                <ChartCard
                  icon={Droplets} label="Vapeur d'eau partielle"
                  value={`${fv(lastVal(series.partialVap), 2)} hPa`} unit="hPa"
                  accent="text-teal-600" data={series.partialVap}
                  color="#0D9488" kind="area"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ── Extérieur ── */}
      {!loading && tab === "exterior" && (
        <>
          {extData.length === 0 ? (
            <EmptyState range={range} />
          ) : (
            <>
              <SectionHeader
                icon={<Sun className="h-4 w-4" />}
                title="Station météo + capteur solaire — Données extérieures"
                count={extData.length}
                latestTs={latestFmt(extData)}
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChartCard
                  icon={Thermometer} label="Température extérieure"
                  value={`${fv(lastVal(series.outdoorTemp))} °C`} unit="°C"
                  accent="text-orange-500" data={series.outdoorTemp}
                  color="#F97316" kind="area" className="lg:col-span-2"
                />
                <ChartCard
                  icon={Sun} label="Irradiance solaire"
                  value={`${fv(lastVal(series.irradiance), 0)} W/m²`} unit="W/m²"
                  accent="text-yellow-500" data={series.irradiance}
                  color="#EAB308" kind="area"
                />
                <ChartCard
                  icon={Droplets} label="Humidité extérieure"
                  value={`${fv(lastVal(series.outdoorHum))} %`} unit="%"
                  accent="text-sky-600" data={series.outdoorHum}
                  color="#38BDF8" kind="area"
                />
                <ChartCard
                  icon={Wind} label="Vitesse du vent"
                  value={`${fv(lastVal(series.wind))} km/h`} unit="km/h"
                  accent="text-slate-600" data={series.wind}
                  color="#64748B" kind="line"
                />
                <ChartCard
                  icon={CloudRain} label="Précipitations"
                  value={`${fv(lastVal(series.rain))} mm`} unit="mm"
                  accent="text-blue-600" data={series.rain}
                  color="#2563EB" kind="bar"
                />
                <ChartCard
                  icon={Gauge} label="Batterie capteur solaire"
                  value={`${fv(lastVal(series.batteryV), 3)} V`} unit="V"
                  accent="text-emerald-600" data={series.batteryV}
                  color="#10B981" kind="line"
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
