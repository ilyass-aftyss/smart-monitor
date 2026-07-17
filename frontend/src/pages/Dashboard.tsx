import { motion } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import HeroPanel from '../components/dashboard/HeroPanel'
import WaterFlowChart from '../components/dashboard/WaterFlowChart'
import PowerConsumptionChart from '../components/dashboard/PowerConsumptionChart'
import GrowthRateChart from '../components/dashboard/GrowthRateChart'
import CO2Chart from '../components/dashboard/CO2Chart'
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <WaterFlowChart />
          <PowerConsumptionChart />
        </div>
      </div>

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
    </div>
  )
}
