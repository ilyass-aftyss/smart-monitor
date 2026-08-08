import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  BatteryMedium,
  Gauge,
  Sparkles,
  Lightbulb,
  Leaf,
  Clock3,
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react"
import { KpiCard } from "../components/dashboard/KpiCard"
import { useLatestSensorData } from "../hooks/useSensorData"

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** Formate un timestamp ISO ou "YYYY-MM-DD HH:MM:SS" → heure locale HH:MM:SS */
function fmtTime(ts?: string | null): string {
  if (!ts) return "—"
  try {
    return new Date(ts.replace(" ", "T")).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    })
  } catch { return ts }
}

/** Formate une valeur numérique avec N décimales ou retourne "—" */
function fv(v?: number | null, dec = 1): string {
  return v != null ? v.toFixed(dec) : "—"
}

/* ─── sub-components ──────────────────────────────────────────────────────── */

function SectionTitle({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/60 backdrop-blur text-primary">
          {icon}
        </span>
        <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      {sub && <p className="mt-0.5 ml-9 text-xs text-muted-foreground font-mono">{sub}</p>}
    </div>
  )
}

function StatusRing({ score, label }: { score: number; label: string }) {
  const radius = 42
  const c = 2 * Math.PI * radius
  const dash = (score / 100) * c
  const ringColor =
    score > 75 ? "#10B981" : score > 50 ? "#0D98BA" : score > 25 ? "#F59E0B" : "#EF4444"
  return (
    <div className="glass-card-strong flex min-h-[180px] flex-col items-center justify-center gap-1.5 p-4">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="oklch(0.9 0.02 145)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-black text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground/80">{label}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Indice climatique</span>
    </div>
  )
}

/** Affichage pendant le premier chargement */
function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <RefreshCw className="h-8 w-8 animate-spin text-primary/60" />
      <span className="text-sm font-medium">Connexion à la station…</span>
      <span className="text-xs font-mono">Interrogation du capteur HD50 + station météo</span>
    </div>
  )
}

/* ─── page ────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { internal, external, loading, lastUpdate } = useLatestSensorData(20000)

  /* Calcul score climatique — uniquement si on a les données réelles */
  const temp = internal?.temperature ?? null
  const hum  = internal?.humidity  ?? null
  const score = (temp != null && hum != null)
    ? Math.round(
        (Math.max(0, 100 - Math.abs(temp - 24) * 4) +
         Math.max(0, 100 - Math.abs(hum  - 60) * 1.5)) / 2
      )
    : 0
  const scoreLabel =
    score > 75 ? "Optimal" : score > 50 ? "Correct" : score > 25 ? "Attention" : "—"

  /* Timestamp affiché : timestamp capteur si dispo, sinon heure du fetch */
  const displayTime =
    internal?.timestamp
      ? fmtTime(internal.timestamp)
      : lastUpdate?.toLocaleTimeString("fr-FR") ?? "—"

  const isConnected = !loading && (internal != null || external != null)

  if (loading && internal == null) return <LoadingOverlay />

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Vue d'ensemble
          </h1>
          <p className="text-sm text-muted-foreground">
            Données temps réel — station physique Serre Fraisier
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live indicator */}
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: "0.72rem", fontFamily: '"JetBrains Mono", monospace', fontWeight: 600,
              padding: "4px 12px", borderRadius: 8,
              background: isConnected ? "rgba(16,185,129,0.09)" : "rgba(239,68,68,0.08)",
              color: isConnected ? "#10B981" : "#EF4444",
              border: `1px solid ${isConnected ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            {isConnected
              ? <Wifi size={12} />
              : <WifiOff size={12} />}
            {isConnected ? "Station connectée" : "En attente de la station…"}
          </span>

          {/* Timestamp */}
          <span className="flex items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            <Clock3 className="h-4 w-4 text-cyan-700" />
            <span className="text-xs text-slate-500">Dernière lecture</span>
            <span className="font-mono text-sm text-cyan-800">{displayTime}</span>
          </span>
        </div>
      </div>

      {/* ── Bloc intérieur — Capteur HD50 ── */}
      <section>
        <SectionTitle
          icon={<Leaf className="h-4 w-4" />}
          title="Climat intérieur — Capteur HD50"
          sub={internal?.timestamp ? `Acquisition : ${fmtTime(internal.timestamp)}` : undefined}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1.25rem" }}>
          <KpiCard
            icon={Thermometer}
            label="Température"
            value={fv(internal?.temperature)}
            unit="°C"
            accent="text-orange-500"
            hint={internal?.dew_point != null ? `Point de rosée ${fv(internal.dew_point)} °C` : undefined}
            className="col-span-2 row-span-2 min-h-[240px]"
          />
          <KpiCard
            icon={Droplets}
            label="Humidité"
            value={fv(internal?.humidity)}
            unit="%"
            accent="text-sky-600"
            hint={internal?.partial_vapor_pressure != null
              ? `Vapeur ${fv(internal.partial_vapor_pressure, 2)} hPa`
              : undefined}
            className="col-span-2 min-h-[160px]"
          />
          <StatusRing score={score} label={scoreLabel} />
          <KpiCard
            icon={Sparkles}
            label="CO₂"
            value={fv(internal?.co2, 0)}
            unit="ppm"
            accent="text-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1.25rem", marginTop: "1.5rem" }}>
          <KpiCard
            icon={Lightbulb}
            label="Illuminance"
            value={fv(internal?.illuminance, 0)}
            unit="lux"
            accent="text-amber-500"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Gauge}
            label="Pression atm."
            value={fv(internal?.pressure)}
            unit="hPa"
            accent="text-indigo-500"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Droplets}
            label="Point de rosée"
            value={fv(internal?.dew_point)}
            unit="°C"
            accent="text-cyan-600"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Wind}
            label="Vapeur partielle"
            value={fv(internal?.partial_vapor_pressure, 2)}
            unit="hPa"
            accent="text-teal-600"
            className="min-h-[120px]"
          />
        </div>
      </section>

      {/* ── Bloc extérieur — Station météo + Capteur solaire ── */}
      <section>
        <SectionTitle
          icon={<Sun className="h-4 w-4" />}
          title={external?.device_name
            ? `Conditions extérieures — ${external.device_name}`
            : "Conditions extérieures"}
          sub={
            [
              external?.timestamp ? `Acquisition : ${fmtTime(external.timestamp)}` : null,
              external?.rssi != null ? `RSSI ${external.rssi} dBm` : null,
            ].filter(Boolean).join(" · ") || undefined
          }
        />

        {/* Météo */}
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: "1.25rem" }}>
          <KpiCard
            icon={Thermometer}
            label="Température ext."
            value={fv(external?.temperature, 2)}
            unit="°C"
            accent="text-orange-500"
            className="col-span-2 row-span-2 min-h-[240px]"
          />
          <KpiCard
            icon={Droplets}
            label="Humidité ext."
            value={fv(external?.humidity, 2)}
            unit="%"
            accent="text-sky-600"
            className="col-span-2 min-h-[160px]"
          />
          <KpiCard
            icon={Wind}
            label="Vent"
            value={fv(external?.wind_speed)}
            unit={`km/h${external?.wind_cardinal ? " · " + external.wind_cardinal : ""}`}
            accent="text-slate-600"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={CloudRain}
            label="Pluie"
            value={fv(external?.rain)}
            unit="mm"
            accent="text-blue-600"
            className="min-h-[120px]"
          />
        </div>

        {/* Solaire */}
        <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: "1.25rem", marginTop: "1.5rem" }}>
          <KpiCard
            icon={Sun}
            label="Irradiance solaire"
            value={fv(external?.radiation)}
            unit="W/m²"
            accent="text-yellow-500"
            hint={external?.solar_device_name ?? undefined}
            className="lg:col-span-2 min-h-[120px]"
          />
          <KpiCard
            icon={BatteryMedium}
            label="Batterie capteur solaire"
            value={fv(external?.battery_v, 3)}
            unit="V"
            accent="text-emerald-600"
            className="min-h-[120px]"
          />
        </div>
      </section>
    </div>
  )
}
