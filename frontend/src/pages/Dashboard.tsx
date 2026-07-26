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
  Wind as Wind2,
  Leaf,
} from "lucide-react"
import { KpiCard } from "../components/dashboard/KpiCard"
import { useLatestSensorData } from "../hooks/useSensorData"
import { mockInternal, mockExternal } from "../lib/mockSensors"

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/60 backdrop-blur text-primary">
        {icon}
      </span>
      <h2 className="text-lg font-bold tracking-tight text-foreground">{title}</h2>
    </div>
  )
}

function StatusRing({ score, label }: { score: number; label: string }) {
  const radius = 42
  const c = 2 * Math.PI * radius
  const dash = (score / 100) * c
  return (
    <div className="glass-card-strong flex min-h-[180px] flex-col items-center justify-center gap-1.5 p-4">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="oklch(0.9 0.02 145)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-xl font-black text-foreground">{score}%</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground/80">{label}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Indice global</span>
    </div>
  )
}

export default function DashboardPage() {
  const { internal: apiInternal, external: apiExternal, loading, lastUpdate } = useLatestSensorData(30000)

  const internal = apiInternal ?? mockInternal
  const external = apiExternal ?? mockExternal

  const temp = internal.temperature
  const hum = internal.humidity
  const tempScore = Math.max(0, 100 - Math.abs(temp - 24) * 6)
  const humScore = Math.max(0, 100 - Math.abs(hum - 60) * 2)
  const status = Math.round((tempScore + humScore) / 2)
  const statusLabel =
    status > 75 ? "Optimal" : status > 50 ? "Correct" : status > 25 ? "Attention" : "Critique"

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Vue d'ensemble
          </h1>
          <p className="text-sm text-muted-foreground">
            Données intérieures et extérieures — mises à jour en direct
          </p>
        </div>
        <span className="glass-card px-3 py-1.5 text-xs font-medium text-foreground/80">
          Dernière lecture · {lastUpdate?.toLocaleTimeString('fr-FR') ?? internal.timestamp}
        </span>
      </div>

      <section className="mb-8">
        <SectionTitle icon={<Leaf className="h-4 w-4" />} title="Climat intérieur" />

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '1.25rem' }}>
          <KpiCard
            icon={Thermometer}
            label="Température"
            value={temp.toFixed(1)}
            unit="°C"
            accent="text-orange-500"
            hint={`Point de rosée ${internal.dew_point?.toFixed(1) ?? '—'} °C`}
            className="col-span-2 row-span-2 min-h-[240px]"
          />

          <KpiCard
            icon={Droplets}
            label="Humidité"
            value={hum.toFixed(1)}
            unit="%"
            accent="text-sky-600"
            hint={`Vapeur ${internal.partial_vapor_pressure?.toFixed(2) ?? '—'} hPa`}
            className="col-span-2 min-h-[160px]"
          />

          <StatusRing score={status} label={statusLabel} />

          <KpiCard
            icon={Sparkles}
            label="CO₂"
            value={internal.co2?.toString() ?? '—'}
            unit="ppm"
            accent="text-emerald-600"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
          <KpiCard
            icon={Lightbulb}
            label="Illuminance"
            value={internal.illuminance?.toString() ?? '—'}
            unit="lux"
            accent="text-amber-500"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Gauge}
            label="Pression"
            value={internal.pressure?.toFixed(1) ?? '—'}
            unit="hPa"
            accent="text-indigo-500"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Droplets}
            label="Point de rosée"
            value={internal.dew_point?.toFixed(1) ?? '—'}
            unit="°C"
            accent="text-cyan-600"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={Wind2}
            label="Vapeur partielle"
            value={internal.partial_vapor_pressure?.toFixed(2) ?? '—'}
            unit="hPa"
            accent="text-teal-600"
            className="min-h-[120px]"
          />
        </div>
      </section>

      <section>
        <SectionTitle icon={<Sun className="h-4 w-4" />} title="Conditions extérieures" />

        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: '1.25rem' }}>
          <KpiCard
            icon={Thermometer}
            label="Température ext."
            value={external.temperature?.toFixed(1) ?? '—'}
            unit="°C"
            accent="text-orange-500"
            className="col-span-2 row-span-2 min-h-[240px]"
            hint={`Station · RSSI ${external.rssi ?? '—'} dBm`}
          />
          <KpiCard
            icon={Droplets}
            label="Humidité ext."
            value={external.humidity?.toFixed(1) ?? '—'}
            unit="%"
            accent="text-sky-600"
            className="col-span-2 min-h-[160px]"
          />
          <KpiCard
            icon={Wind}
            label="Vent"
            value={external.wind_speed?.toFixed(1) ?? '—'}
            unit={`km/h · ${external.wind_cardinal ?? '—'}`}
            accent="text-slate-600"
            className="min-h-[120px]"
          />
          <KpiCard
            icon={CloudRain}
            label="Pluie"
            value={external.rain?.toFixed(1) ?? '—'}
            unit="mm"
            accent="text-blue-600"
            className="min-h-[120px]"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
          <KpiCard
            icon={Sun}
            label="Irradiance solaire"
            value={external.radiation?.toFixed(1) ?? '—'}
            unit="W/m²"
            accent="text-yellow-500"
            className="lg:col-span-2 min-h-[120px]"
          />
          <KpiCard
            icon={BatteryMedium}
            label="Batterie capteur"
            value={external.battery_v?.toFixed(3) ?? '—'}
            unit="V"
            accent="text-emerald-600"
            className="min-h-[120px]"
          />
        </div>
      </section>
    </div>
  )
}
