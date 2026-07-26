import { useMemo, useState, useEffect } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Thermometer,
  Droplets,
  Sparkles,
  Sun,
  Wind,
  CloudRain,
  Gauge,
  Lightbulb,
  Calendar,
} from "lucide-react"
import { internalApi, externalApi } from "../services/api"
import { mockInternal, mockExternal, makeHistory } from "../lib/mockSensors"
import type { InternalData, ExternalData } from "../types"

const RANGES = ["24h", "7j", "30j"] as const
type Range = (typeof RANGES)[number]

interface SeriesPoint {
  time: string
  value: number
}

function toPoint(data: any[], key: string): SeriesPoint[] {
  if (!data || data.length === 0) return []
  return data.map((d: any) => ({
    time: new Date(d.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    value: parseFloat(((d[key] as number) || 0).toFixed(2)),
  }))
}

interface ChartCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  accent: string
  data: SeriesPoint[]
  color: string
  kind: "area" | "line" | "bar"
  className?: string
}

function ChartCard({
  icon: Icon,
  label,
  value,
  accent,
  data,
  color,
  kind,
  className = "",
}: ChartCardProps) {
  return (
    <div className={`glass-card p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/70 ${accent}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-medium text-foreground/80">{label}</span>
        </div>
        <span className="text-lg font-black tracking-tight text-foreground">{value}</span>
      </div>

      <div className="mt-3 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {kind === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#g-${label})`} />
            </AreaChart>
          ) : kind === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.9 0.01 150 / 40%)" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "oklch(0.5 0.02 150)" }} width={40} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const tooltipStyle = {
  background: "oklch(1 0 0 / 90%)",
  border: "1px solid oklch(1 0 0 / 60%)",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "0 8px 24px oklch(0.2 0.03 150 / 12%)",
  backdropFilter: "blur(12px)",
} as const

function buildMockHistory(range: Range) {
  const points = range === "24h" ? 24 : range === "7j" ? 24 : 30
  const s = mockInternal
  const e = mockExternal
  return {
    indoorTemp: makeHistory(s.temperature, 4, points),
    indoorHum: makeHistory(s.humidity, 6, points),
    co2: makeHistory(s.co2, 40, points),
    lux: makeHistory(s.illuminance ?? 542, 120, points),
    pressure: makeHistory(s.pressure, 3, points),
    outdoorTemp: makeHistory(e.temperature, 5, points),
    wind: makeHistory(e.wind_speed + 6, 4, points),
    rain: makeHistory((e.rain ?? 0) + 1, 1.2, points),
    irradiance: makeHistory(e.radiation, 120, points),
  }
}

export default function HistoryPage() {
  const [range, setRange] = useState<Range>("24h")
  const [internalData, setInternal] = useState<InternalData[]>([])
  const [externalData, setExternal] = useState<ExternalData[]>([])
  const [apiFailed, setApiFailed] = useState(false)

  const hoursMap: Record<Range, number> = { "24h": 24, "7j": 168, "30j": 720 }

  useEffect(() => {
    setApiFailed(false)
    const h = hoursMap[range]
    Promise.all([
      internalApi.history(h, 500),
      externalApi.history(h, 500),
    ]).then(([i, e]) => {
      if (i.data?.length > 0 || e.data?.length > 0) {
        setInternal(i.data)
        setExternal(e.data)
      } else {
        setApiFailed(true)
      }
    }).catch(() => setApiFailed(true))
  }, [range])

  const series = useMemo(() => {
    if (apiFailed || internalData.length === 0) {
      return buildMockHistory(range)
    }
    return {
      indoorTemp: toPoint(internalData, "temperature"),
      indoorHum: toPoint(internalData, "humidity"),
      co2: toPoint(internalData, "co2"),
      lux: toPoint(internalData, "illuminance_lux"),
      pressure: toPoint(internalData, "pressure"),
      outdoorTemp: toPoint(externalData, "temperature"),
      wind: toPoint(externalData, "wind_speed"),
      rain: toPoint(externalData, "rain"),
      irradiance: toPoint(externalData, "radiation"),
    }
  }, [internalData, externalData, apiFailed, range])

  const last = (arr: SeriesPoint[]) => arr?.[arr.length - 1]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Historique
          </h1>
          <p className="text-sm text-muted-foreground">
            Évolution des capteurs sur la période sélectionnée
          </p>
        </div>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          icon={Thermometer}
          label="Température intérieure"
          value={`${last(series.indoorTemp)?.value.toFixed(1) ?? '—'} °C`}
          accent="text-orange-500"
          data={series.indoorTemp}
          color="var(--chart-4)"
          kind="area"
        />
        <ChartCard
          icon={Droplets}
          label="Humidité intérieure"
          value={`${last(series.indoorHum)?.value.toFixed(1) ?? '—'} %`}
          accent="text-sky-600"
          data={series.indoorHum}
          color="var(--chart-2)"
          kind="area"
        />
        <ChartCard
          icon={Sparkles}
          label="CO₂"
          value={`${Math.round(last(series.co2)?.value ?? 0)} ppm`}
          accent="text-emerald-600"
          data={series.co2}
          color="var(--chart-1)"
          kind="bar"
        />
        <ChartCard
          icon={Lightbulb}
          label="Illuminance"
          value={`${Math.round(last(series.lux)?.value ?? 0)} lux`}
          accent="text-amber-500"
          data={series.lux}
          color="var(--chart-3)"
          kind="area"
        />
        <ChartCard
          icon={Thermometer}
          label="Température extérieure"
          value={`${last(series.outdoorTemp)?.value.toFixed(1) ?? '—'} °C`}
          accent="text-orange-500"
          data={series.outdoorTemp}
          color="var(--chart-4)"
          kind="line"
        />
        <ChartCard
          icon={Sun}
          label="Irradiance solaire"
          value={`${Math.round(last(series.irradiance)?.value ?? 0)} W/m²`}
          accent="text-yellow-500"
          data={series.irradiance}
          color="var(--chart-3)"
          kind="area"
        />
        <ChartCard
          icon={Wind}
          label="Vent"
          value={`${last(series.wind)?.value.toFixed(1) ?? '—'} km/h`}
          accent="text-slate-600"
          data={series.wind}
          color="var(--chart-5)"
          kind="line"
        />
        <ChartCard
          icon={CloudRain}
          label="Pluie"
          value={`${last(series.rain)?.value.toFixed(1) ?? '—'} mm`}
          accent="text-blue-600"
          data={series.rain}
          color="var(--chart-2)"
          kind="bar"
        />
        <ChartCard
          icon={Gauge}
          label="Pression atmosphérique"
          value={`${last(series.pressure)?.value.toFixed(1) ?? '—'} hPa`}
          accent="text-indigo-500"
          data={series.pressure}
          color="var(--chart-5)"
          kind="line"
          className="lg:col-span-2"
        />
      </div>
    </div>
  )
}
