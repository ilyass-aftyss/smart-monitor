import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Text, Float, Sparkles, Html } from '@react-three/drei'
import * as THREE from 'three'
import { Box, Typography, Paper, Chip, CircularProgress, Slider, FormControlLabel, Switch, IconButton } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'

// ─── Constants ─────────────────────────────────────────────────────────────────
const W = 5     // width  (X axis)  5 m
const L = 10    // length (Z axis) 10 m
const H = 3     // wall height      3 m
const RIDGE_H = H + 1.2  // apex of pitched roof

const GUTTER_LENGTH = 8.5
const GUTTER_HEIGHT = 1.0
const GUTTER_POSITIONS_X = [-1.25, 0, 1.25]
const PLANTS_PER_GUTTER = 27
const PLANT_SPACING = GUTTER_LENGTH / (PLANTS_PER_GUTTER - 1)

// ─── Colour helpers ─────────────────────────────────────────────────────────────
function tempToColor(temp: number): THREE.Color {
  if (temp < 10) return new THREE.Color('#0033ff')
  if (temp < 15) return new THREE.Color('#0066ff')
  if (temp < 20) return new THREE.Color('#00aaff')
  if (temp < 25) return new THREE.Color('#00ffaa')
  if (temp < 30) return new THREE.Color('#ffaa00')
  if (temp < 35) return new THREE.Color('#ff6600')
  return new THREE.Color('#ff2200')
}

// ─── Window config — 6 windows: 3 upper (roof), 3 lower (walls) ───────────────
interface WindowConfig {
  id: string
  label: string
  position: [number, number, number]
  rotation: [number, number, number]
  side: 'south' | 'north'
  row: 'upper' | 'lower'
  openAngle: number   // degrees 0-90
}

const WINDOWS: WindowConfig[] = [
  // Lower row — south wall (Z = +5), bottom half
  { id: 'w-s-l-1', label: 'Fenêtre S1', position: [-1.5, 1.0, L / 2], rotation: [0, 0, 0], side: 'south', row: 'lower', openAngle: 0 },
  { id: 'w-s-l-2', label: 'Fenêtre S2', position: [ 0,   1.0, L / 2], rotation: [0, 0, 0], side: 'south', row: 'lower', openAngle: 0 },
  { id: 'w-s-l-3', label: 'Fenêtre S3', position: [ 1.5, 1.0, L / 2], rotation: [0, 0, 0], side: 'south', row: 'lower', openAngle: 0 },
  // Upper row — north wall (Z = -5), upper half (ridge vents)
  { id: 'w-n-u-1', label: 'Fenêtre N1', position: [-1.5, 2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
  { id: 'w-n-u-2', label: 'Fenêtre N2', position: [ 0,   2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
  { id: 'w-n-u-3', label: 'Fenêtre N3', position: [ 1.5, 2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
]

// ─── Internal sensor layout ─────────────────────────────────────────────────────
interface SensorConfig {
  id: string
  label: string
  position: [number, number, number]
  color: string
  getValue: (d: any) => { label: string; value: string }[]
  zone: string
}

const SENSOR_CONFIGS: SensorConfig[] = [
  {
    id: 'sensor-north',
    label: 'Capteur Nord',
    position: [-1.5, 1.6, -3.5],
    color: '#00aaff',
    zone: 'Zone Nord',
    getValue: (d) => [
      { label: 'Température', value: `${d.temperature?.toFixed(1)} °C` },
      { label: 'Humidité', value: `${d.humidity?.toFixed(1)} %` },
      { label: 'CO₂', value: `${d.co2?.toFixed(0)} ppm` },
      { label: 'VPD', value: `${d.vpd?.toFixed(2)} kPa` },
    ],
  },
  {
    id: 'sensor-center',
    label: 'Capteur Centre',
    position: [0, 1.6, 0],
    color: '#00ffaa',
    zone: 'Zone Centre',
    getValue: (d) => [
      { label: 'Température', value: `${d.temperature?.toFixed(1)} °C` },
      { label: 'Humidité', value: `${d.humidity?.toFixed(1)} %` },
      { label: 'VPD', value: `${d.vpd?.toFixed(2)} kPa` },
      { label: 'VOC', value: `${d.voc?.toFixed(0)} ppb` },
    ],
  },
  {
    id: 'sensor-south',
    label: 'Capteur Sud',
    position: [1.5, 1.6, 3.5],
    color: '#ffaa00',
    zone: 'Zone Sud',
    getValue: (d) => [
      { label: 'Température', value: `${d.temperature?.toFixed(1)} °C` },
      { label: 'Humidité', value: `${d.humidity?.toFixed(1)} %` },
      { label: 'Pression', value: `${d.pressure?.toFixed(0)} hPa` },
      { label: 'Pt. Rosée', value: `${d.dew_point?.toFixed(1)} °C` },
    ],
  },
  {
    id: 'sensor-ext',
    label: 'Station Ext.',
    position: [W / 2 + 1.2, 1.5, 0],
    color: '#f97316',
    zone: 'Extérieur',
    getValue: (d) => [
      { label: 'Temp. Ext', value: `${d.temperature?.toFixed(1)} °C` },
      { label: 'Hum. Ext', value: `${d.humidity?.toFixed(1)} %` },
      { label: 'Vent', value: `${d.wind_speed?.toFixed(1)} m/s` },
      { label: 'Radiation', value: `${d.radiation?.toFixed(0)} W/m²` },
    ],
  },
]

// ─── Interior Airflow Lines (wavy, temperature-coloured) ────────────────────────
function AirflowParticles({
  windSpeed,
  extTemp,
  intTemp,
  windowsOpen,
  allClosed,
}: {
  windSpeed: number
  extTemp: number
  intTemp: number
  windowsOpen: boolean
  allClosed: boolean
}) {
  // Number of flow lines scales with wind speed
  const lineCount = allClosed ? 0 : Math.min(Math.round(windSpeed * 2.5 + 3), 18)
  const pointsPerLine = 60

  // colour = exterior temp (what's coming in)
  const hexColor = useMemo(() => {
    const c = tempToColor(extTemp)
    return '#' + c.getHexString()
  }, [extTemp])

  // Each line gets a fixed Y lane + phase offset, computed once
  const laneConfig = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      y: 0.25 + (i / 17) * (H - 0.5),
      xOff: (Math.random() - 0.5) * (W * 0.85),
      phase: Math.random() * Math.PI * 2,
      ampY: 0.06 + Math.random() * 0.10,
      ampX: 0.05 + Math.random() * 0.07,
      speedMul: 0.7 + Math.random() * 0.6,
    }))
  }, [])

  const meshesRef = useRef<(THREE.Line | null)[]>([])

  useFrame(({ clock }) => {
    if (allClosed || lineCount === 0) return
    const t = clock.getElapsedTime()
    const baseSpeed = Math.max(0.6, windSpeed * 0.45)

    meshesRef.current.forEach((lineObj, i) => {
      if (!lineObj || i >= lineCount) return
      const cfg = laneConfig[i]
      const pos = lineObj.geometry.attributes.position.array as Float32Array

      for (let j = 0; j <= pointsPerLine; j++) {
        const progress = j / pointsPerLine           // 0 → 1 along Z axis (south to north)
        const zPos = -L / 2 + ((progress * L + t * baseSpeed * cfg.speedMul) % L)
        const xPos = cfg.xOff + Math.sin(progress * Math.PI * 5 + t * 2.2 + cfg.phase) * cfg.ampX
        const yPos = cfg.y + Math.sin(progress * Math.PI * 7 + t * 1.8 + cfg.phase * 1.3) * cfg.ampY

        const idx = j * 3
        pos[idx]     = xPos
        pos[idx + 1] = yPos
        pos[idx + 2] = zPos
      }
      lineObj.geometry.attributes.position.needsUpdate = true
    })
  })

  if (allClosed || lineCount === 0) return null

  const opacity = Math.min(0.25 + windSpeed * 0.045, 0.85)

  return (
    <group>
      {laneConfig.slice(0, lineCount).map((_, i) => {
        const positions = new Float32Array((pointsPerLine + 1) * 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return (
          <primitive
            key={i}
            object={new THREE.Line(
              geometry,
              new THREE.LineBasicMaterial({ color: hexColor, transparent: true, opacity })
            )}
            ref={(ref: THREE.Line) => { meshesRef.current[i] = ref }}
          />
        )
      })}
    </group>
  )
}

// ─── External wind lines (wavy) ─────────────────────────────────────────────────
function WindLines({ windSpeed }: { windSpeed: number }) {
  const lineCount = Math.min(Math.round(windSpeed * 0.8), 6)
  const pointsPerLine = 40
  const color = windSpeed > 10 ? '#ff6600' : windSpeed > 5 ? '#ffaa00' : '#00ccff'

  const lines = useMemo(() => {
    return Array.from({ length: lineCount }).map((_, i) => {
      const yOff = (i / lineCount) * H * 0.7 + 0.3
      const phaseOff = i * 1.7
      const amp = 0.1 + windSpeed * 0.02
      return { yOff, phaseOff, amp }
    })
  }, [lineCount, windSpeed])

  const meshesRef = useRef<(THREE.Line | null)[]>([])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    meshesRef.current.forEach((child, i) => {
      if (!child || i >= lines.length) return
      const line = lines[i]
      const pos = child.geometry.attributes.position.array as Float32Array
      for (let j = 0; j <= pointsPerLine; j++) {
        const progress = j / pointsPerLine
        const x = (progress - 0.5) * (L + 2)
        const zBase = -L / 2 - 0.5 + ((t * windSpeed * 0.3 + i * 1.2) % (L + 2))
        const z = zBase + Math.sin(progress * Math.PI * 4 + t * 2.5 + line.phaseOff) * line.amp
        const idx = j * 3
        pos[idx] = x
        pos[idx + 1] = line.yOff + Math.sin(progress * Math.PI * 6 + t * 2 + line.phaseOff) * line.amp * 0.5
        pos[idx + 2] = z
      }
      child.geometry.attributes.position.needsUpdate = true
    })
  })

  if (windSpeed < 0.3) return null

  return (
    <group position={[W / 2 + 0.3, 0, 0]}>
      {lines.map((line, i) => {
        const positions = new Float32Array((pointsPerLine + 1) * 3)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return (
          <primitive
            key={i}
            object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
              color,
              transparent: true,
              opacity: 0.5 + windSpeed * 0.025,
            }))}
            ref={(ref: THREE.Line) => { meshesRef.current[i] = ref }}
          />
        )
      })}
    </group>
  )
}

// ─── Rain System ────────────────────────────────────────────────────────────────
function RainSystem({ humidity, windSpeed }: { humidity: number; windSpeed: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = humidity > 80 ? 300 : humidity > 70 ? 150 : 0
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const drops = useMemo(() =>
    Array.from({ length: 300 }).map(() => ({
      x: (Math.random() - 0.5) * (W + 4),
      y: Math.random() * 8,
      z: (Math.random() - 0.5) * (L + 4),
      speed: 2 + Math.random() * 3,
    })), [])

  useFrame((_, delta) => {
    if (!meshRef.current || count === 0) return
    const tilt = Math.min(windSpeed * 0.04, 0.3)
    drops.slice(0, count).forEach((d, i) => {
      d.y -= delta * d.speed
      d.z += delta * tilt * d.speed
      if (d.y < -0.5) { d.y = 8; d.z = (Math.random() - 0.5) * (L + 4) }
      dummy.position.set(d.x, d.y, d.z)
      dummy.scale.set(0.015, 0.12, 0.015)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (count === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 300]}>
      <cylinderGeometry args={[1, 1, 1, 4]} />
      <meshStandardMaterial color="#88ccff" transparent opacity={0.4} />
    </instancedMesh>
  )
}

// ─── Window (panel that rotates open) ─────────────────────────────────────────
function GreenhouseWindow({
  config,
  openAngle,
  onClick,
}: {
  config: WindowConfig
  openAngle: number
  onClick: () => void
}) {
  const panelRef = useRef<THREE.Mesh>(null)
  const targetAngle = (openAngle / 90) * (Math.PI / 2)

  useFrame((_, delta) => {
    if (!panelRef.current) return
    const current = panelRef.current.rotation.x
    panelRef.current.rotation.x = THREE.MathUtils.lerp(current, targetAngle, delta * 4)
  })

  const isOpen = openAngle > 5
  const frameColor = isOpen ? '#00ff88' : '#1a3d7a'
  const glassColor = isOpen ? '#88ffcc' : '#1a5a8a'

  return (
    <group position={config.position} rotation={config.rotation}>
      {/* Frame */}
      <mesh onClick={onClick}>
        <boxGeometry args={[0.7, 0.6, 0.04]} />
        <meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.15} metalness={0.8} roughness={0.2} transparent opacity={0.0} />
      </mesh>
      {/* Glass panel — hinged at bottom */}
      <group position={[0, -0.3, 0]}>
        <mesh ref={panelRef} position={[0, 0.3, 0.02]}>
          <boxGeometry args={[0.65, 0.55, 0.015]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.35} metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Frame border */}
      {[[-0.35, 0], [0.35, 0]].map(([x], i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.04, 0.62, 0.05]} />
          <meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {[0, 0.3, -0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.74, 0.035, 0.05]} />
          <meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Open indicator light */}
      {isOpen && <pointLight color="#00ff88" intensity={0.3} distance={1.5} />}
      {/* Label */}
      <Text position={[0, -0.5, 0.05]} fontSize={0.07} color={isOpen ? '#00ff88' : '#8aaccc'} anchorX="center">
        {config.label} {isOpen ? `${openAngle}°` : 'fermée'}
      </Text>
    </group>
  )
}

// ─── Sensor icons mapped to label keywords ─────────────────────────────────────
function sensorIcon(label: string): string {
  if (label.includes('Temp')) return '🌡'
  if (label.includes('CO')) return '💨'
  if (label.includes('Hum')) return '💧'
  if (label.includes('VPD')) return '🌫'
  if (label.includes('VOC')) return '⚗'
  if (label.includes('Pression')) return '🔵'
  if (label.includes('Rosée')) return '❄'
  if (label.includes('Radiation') || label.includes('Rayon')) return '☀'
  if (label.includes('Vent')) return '🌬'
  return '◈'
}

// Pulsing halo ring around selected sensor
function PulsingHalo({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const s = 1 + 0.18 * Math.sin(clock.getElapsedTime() * 4)
    ref.current.scale.setScalar(s)
    ;(ref.current.material as THREE.MeshStandardMaterial).opacity =
      0.5 + 0.4 * Math.sin(clock.getElapsedTime() * 4)
  })
  return (
    <mesh ref={ref}>
      <torusGeometry args={[0.28, 0.018, 8, 48]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.8} />
    </mesh>
  )
}

// ─── Clickable Sensor Node — realistic 3D box ──────────────────────────────────
function SensorNode({
  config,
  data,
  selected,
  onSelect,
}: {
  config: SensorConfig
  data: any
  selected: boolean
  onSelect: () => void
}) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const ledRef  = useRef<THREE.Mesh>(null)
  const readings = data ? config.getValue(data) : []

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    // LED blink — fast when selected
    if (ledRef.current) {
      const mat = ledRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = selected
        ? 1.2 + Math.sin(t * 8) * 0.6
        : 0.5 + Math.sin(t * 1.5) * 0.3
    }
  })

  const isExternal = config.id === 'sensor-ext'

  return (
    <group position={config.position} onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect() }}>

      {/* ── Mounting pole (only for internal sensors) ── */}
      {!isExternal && (
        <>
          {/* Pole from floor to sensor */}
          <mesh position={[0, -config.position[1] / 2 - 0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, config.position[1] + 0.1, 8]} />
            <meshStandardMaterial color="#334466" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Base foot */}
          <mesh position={[0, -config.position[1] + 0.02, 0]}>
            <cylinderGeometry args={[0.055, 0.07, 0.04, 12]} />
            <meshStandardMaterial color="#222244" metalness={0.8} roughness={0.3} />
          </mesh>
        </>
      )}

      {/* ── Main sensor housing ── */}
      {/* Body — rounded box */}
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[0.18, 0.24, 0.12]} />
        <meshStandardMaterial
          color={selected ? config.color : '#1a2a3a'}
          emissive={config.color}
          emissiveIntensity={selected ? 0.35 : 0.08}
          metalness={0.6}
          roughness={0.35}
        />
      </mesh>

      {/* Front face plate (slightly raised) */}
      <mesh position={[0, 0, 0.063]}>
        <boxGeometry args={[0.155, 0.21, 0.008]} />
        <meshStandardMaterial color="#0d1a28" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Screen / display area on front */}
      <mesh position={[0, 0.03, 0.069]}>
        <boxGeometry args={[0.12, 0.11, 0.003]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={selected ? 0.6 : 0.15}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Three tiny buttons on front */}
      {[-0.04, 0, 0.04].map((x, i) => (
        <mesh key={i} position={[x, -0.075, 0.068]}>
          <cylinderGeometry args={[0.008, 0.008, 0.006, 8]} />
          <meshStandardMaterial color="#334455" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* LED indicator — top right corner */}
      <mesh ref={ledRef} position={[0.06, 0.085, 0.069]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Ventilation grille — small lines on side */}
      {[0.04, 0.02, 0, -0.02, -0.04].map((y, i) => (
        <mesh key={i} position={[0.092, y, 0]}>
          <boxGeometry args={[0.003, 0.012, 0.08]} />
          <meshStandardMaterial color="#0a1520" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}

      {/* Antenna (rod on top) */}
      <mesh position={[0.055, 0.19, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.5} metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Antenna tip dot */}
      <mesh position={[0.055, 0.285, 0]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={1.2} />
      </mesh>

      {/* Label text below sensor */}
      <Text
        position={[0, -0.18, 0.07]}
        fontSize={0.065}
        color={selected ? config.color : '#8aaccc'}
        anchorX="center"
        anchorY="top"
      >
        {config.label}
      </Text>

      {/* Pulsing halo when selected */}
      {selected && <PulsingHalo color={config.color} />}

      {/* Point light glow */}
      <pointLight
        color={config.color}
        intensity={selected ? 1.0 : 0.25}
        distance={selected ? 3.0 : 1.8}
      />

      {/* ── Data card — appears on click ── */}
      {selected && data && (
        <Html
          position={[0.45, 0.3, 0]}
          distanceFactor={3.8}
          occlude={false}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div style={{
            fontFamily: '"JetBrains Mono", "Courier New", monospace',
            minWidth: 210,
            filter: 'drop-shadow(0 0 18px ' + config.color + '55)',
          }}>
            {/* Card header */}
            <div style={{
              background: config.color,
              borderRadius: '10px 10px 0 0',
              padding: '8px 14px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'white',
                boxShadow: '0 0 6px white',
              }} />
              <span style={{ color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {config.zone}
              </span>
              <span style={{ marginLeft: 'auto', color: 'rgba(0,0,0,0.6)', fontSize: 9 }}>
                {config.label}
              </span>
            </div>

            {/* Card body */}
            <div style={{
              background: 'rgba(4, 10, 24, 0.97)',
              border: `1px solid ${config.color}55`,
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
              padding: '10px 14px 10px',
            }}>
              {readings.map((r, idx) => (
                <div key={r.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: idx < readings.length - 1 ? 8 : 0,
                  paddingBottom: idx < readings.length - 1 ? 8 : 0,
                  borderBottom: idx < readings.length - 1 ? `1px solid ${config.color}22` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{sensorIcon(r.label)}</span>
                    <span style={{ color: '#8aaccc', fontSize: 10 }}>{r.label}</span>
                  </div>
                  <span style={{
                    color: config.color,
                    fontSize: 13,
                    fontWeight: 800,
                    textShadow: `0 0 8px ${config.color}`,
                    letterSpacing: '0.03em',
                  }}>
                    {r.value}
                  </span>
                </div>
              ))}

              {/* Live pulse bar */}
              <div style={{
                marginTop: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: config.color,
                  boxShadow: `0 0 6px ${config.color}`,
                }} />
                <span style={{ color: '#8aaccc', fontSize: 9, letterSpacing: '0.06em' }}>TEMPS RÉEL · Cliquer pour fermer</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Strawberry plant ────────────────────────────────────────────────────────────
function StrawberryPlant({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + 0.04 * Math.sin(clock.getElapsedTime() * 0.7 + position[0] * 3 + position[2])
    }
  })
  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.055, 6, 4]} />
        <meshStandardMaterial color="#22aa44" emissive="#113322" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>
      {Math.abs(position[2] % 0.9) < 0.3 && (
        <mesh position={[0.04, -0.05, 0.04]}>
          <sphereGeometry args={[0.022, 5, 4]} />
          <meshStandardMaterial color="#dd2244" emissive="#880011" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function CultureGutter({ posX }: { posX: number }) {
  return (
    <group position={[posX, GUTTER_HEIGHT, 0]}>
      <mesh>
        <boxGeometry args={[0.08, 0.06, GUTTER_LENGTH]} />
        <meshStandardMaterial color="#dde8f0" metalness={0.1} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, GUTTER_LENGTH - 0.1]} />
        <meshStandardMaterial color="#8B6914" roughness={1} />
      </mesh>
      {Array.from({ length: PLANTS_PER_GUTTER }).map((_, i) => (
        <StrawberryPlant key={i} position={[0, 0.07, -GUTTER_LENGTH / 2 + i * PLANT_SPACING]} />
      ))}
      <mesh position={[0.05, 0.04, 0]}>
        <cylinderGeometry args={[0.007, 0.007, GUTTER_LENGTH, 6]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.6} />
      </mesh>
    </group>
  )
}

function GutterStructure() {
  return (
    <group>
      {GUTTER_POSITIONS_X.map((x, i) => (
        <group key={i}>
          <CultureGutter posX={x} />
          {[-3, -1, 1, 3].map((z) => (
            <group key={z} position={[x, 0, z]}>
              <mesh position={[0, GUTTER_HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.018, 0.018, GUTTER_HEIGHT, 8]} />
                <meshStandardMaterial color="#aaaacc" metalness={0.8} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.04, 8]} />
                <meshStandardMaterial color="#888899" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  )
}

// ─── Greenhouse structure ───────────────────────────────────────────────────────
function GreenhouseStructure({
  tempColor,
  showWireframe,
  windows,
  onWindowClick,
}: {
  tempColor: THREE.Color
  showWireframe: boolean
  windows: WindowConfig[]
  onWindowClick: (id: string) => void
}) {
  const hw = W / 2
  const hl = L / 2

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#0a1428" metalness={0.2} roughness={0.9} />
      </mesh>

      {/* Floor grid */}
      <gridHelper args={[Math.max(W, L), 10, '#0033aa', '#001155']} position={[0, 0.01, 0]} />

      {/* Walls (glass) */}
      {[
        { pos: [0, H / 2, hl] as [number, number, number],   rot: [0, 0, 0] as [number, number, number],           size: [W, H] as [number, number] },
        { pos: [0, H / 2, -hl] as [number, number, number],  rot: [0, 0, 0] as [number, number, number],           size: [W, H] as [number, number] },
        { pos: [hw, H / 2, 0] as [number, number, number],   rot: [0, Math.PI / 2, 0] as [number, number, number], size: [L, H] as [number, number] },
        { pos: [-hw, H / 2, 0] as [number, number, number],  rot: [0, Math.PI / 2, 0] as [number, number, number], size: [L, H] as [number, number] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos} rotation={wall.rot}>
          <planeGeometry args={wall.size} />
          <meshStandardMaterial color="#1a3a6a" transparent opacity={0.18} side={THREE.DoubleSide} metalness={0.05} roughness={0.05} />
        </mesh>
      ))}

      {/* Roof panels */}
      {[
        { pos: [-hw / 2 - 0.1, H + 0.35, 0] as [number, number, number], rot: [0, 0, -Math.PI / 5.5] as [number, number, number] },
        { pos: [ hw / 2 + 0.1, H + 0.35, 0] as [number, number, number], rot: [0, 0,  Math.PI / 5.5] as [number, number, number] },
      ].map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot}>
          <planeGeometry args={[L, 3.2]} />
          <meshStandardMaterial color="#1a3d7a" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Structural beams — vertical */}
      {([-hw, hw] as number[]).flatMap((x) =>
        ([-hl, -hl / 2, 0, hl / 2, hl] as number[]).map((z) => (
          <mesh key={`v-${x}-${z}`} position={[x, H / 2, z]}>
            <boxGeometry args={[0.055, H, 0.055]} />
            <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.25} metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}

      {/* Horizontal ridge beam */}
      <mesh position={[0, H, 0]}>
        <boxGeometry args={[0.06, 0.06, L]} />
        <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Purlins (top of side walls) */}
      {[-hw, hw].map((x) => (
        <mesh key={`p-${x}`} position={[x, H, 0]}>
          <boxGeometry args={[0.06, 0.06, L]} />
          <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Roof ridge apex beam */}
      <mesh position={[0, RIDGE_H, 0]}>
        <boxGeometry args={[0.07, 0.07, L + 0.2]} />
        <meshStandardMaterial color="#00ccff" emissive="#0066bb" emissiveIntensity={0.4} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Temperature haze fill */}
      {showWireframe && (
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[W - 0.2, H, L - 0.2]} />
          <meshStandardMaterial color={tempColor} transparent opacity={0.04} wireframe={showWireframe} />
        </mesh>
      )}

      {/* Corner glow lights */}
      {([-hw, hw] as number[]).flatMap((x) =>
        ([-hl, hl] as number[]).map((z) => (
          <pointLight key={`cl-${x}-${z}`} position={[x, 0.5, z]} color="#0044aa" intensity={0.25} distance={4} />
        ))
      )}

      {/* Roof ridge lights */}
      {[-3.5, 0, 3.5].map((z) => (
        <pointLight key={`rl-${z}`} position={[0, H + 0.8, z]} color="#00aaff" intensity={0.5} distance={7} />
      ))}

      {/* 6 Windows */}
      {windows.map((win) => (
        <GreenhouseWindow
          key={win.id}
          config={win}
          openAngle={win.openAngle}
          onClick={() => onWindowClick(win.id)}
        />
      ))}
    </group>
  )
}

// ─── Temperature gradient heatmap inside greenhouse ──────────────────────────────
function TempHeatmap({ temp }: { temp: number }) {
  const col = tempToColor(temp)
  return (
    <>
      {/* Subtle temp-coloured fog layer near ceiling */}
      <mesh position={[0, H - 0.3, 0]}>
        <boxGeometry args={[W - 0.3, 0.5, L - 0.3]} />
        <meshStandardMaterial color={col} transparent opacity={0.03} />
      </mesh>
      {/* Warm layer near plants */}
      <mesh position={[0, GUTTER_HEIGHT + 0.2, 0]}>
        <boxGeometry args={[W - 0.4, 0.3, L - 0.4]} />
        <meshStandardMaterial color={col} transparent opacity={0.025} />
      </mesh>
    </>
  )
}

// ─── Scene ──────────────────────────────────────────────────────────────────────
function Scene({
  showWireframe,
  windows,
  onWindowClick,
}: {
  showWireframe: boolean
  windows: WindowConfig[]
  onWindowClick: (id: string) => void
}) {
  const { internal, external } = useLatestSensorData(30000)
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)

  const tempColor = internal ? tempToColor(internal.temperature) : new THREE.Color('#00aaff')
  const windSpeed = external?.wind_speed ?? 2
  const extTemp = external?.temperature ?? 18
  const extHumidity = external?.humidity ?? 60

  const anyOpen = windows.some((w) => w.openAngle > 5)
  const allClosed = !anyOpen

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 9, 6]} intensity={1.1} color="#ffffff" castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.35} color="#4488ff" />
      <pointLight position={[0, 6, 0]} intensity={0.7} color="#0066aa" />
      <hemisphereLight args={['#0a1f4a', '#000510', 0.5]} />

      {/* Ambient sparkles — very subtle */}
      <Sparkles count={60} scale={[W, 4, L]} size={0.6} speed={0.2} color="#00aaff" opacity={0.2} />

      {/* Greenhouse shell */}
      <GreenhouseStructure
        tempColor={tempColor}
        showWireframe={showWireframe}
        windows={windows}
        onWindowClick={onWindowClick}
      />

      {/* Temperature visual heatmap */}
      {internal && <TempHeatmap temp={internal.temperature} />}

      {/* Culture gutters */}
      <GutterStructure />

      {/* Airflow particles (only when windows open) */}
      <AirflowParticles
        windSpeed={windSpeed}
        extTemp={extTemp}
        intTemp={internal?.temperature ?? 20}
        windowsOpen={anyOpen}
        allClosed={allClosed}
      />

      {/* Wind direction arrows (outside east wall) */}
      {windSpeed > 0.5 && (
        <WindLines windSpeed={windSpeed} />
      )}

      {/* Rain */}
      <RainSystem humidity={extHumidity} windSpeed={windSpeed} />

      {/* Sensors — 3 internal */}
      {internal && SENSOR_CONFIGS.slice(0, 3).map((cfg) => (
        <SensorNode
          key={cfg.id}
          config={cfg}
          data={internal}
          selected={selectedSensor === cfg.id}
          onSelect={() => setSelectedSensor((s) => s === cfg.id ? null : cfg.id)}
        />
      ))}

      {/* External station */}
      {external && (
        <SensorNode
          config={SENSOR_CONFIGS[3]}
          data={external}
          selected={selectedSensor === SENSOR_CONFIGS[3].id}
          onSelect={() => setSelectedSensor((s) => s === SENSOR_CONFIGS[3].id ? null : SENSOR_CONFIGS[3].id)}
        />
      )}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={26}
        maxPolarAngle={Math.PI / 1.85}
        target={[0, 1.5, 0]}
        dampingFactor={0.06}
        enableDamping
      />
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function Visualization3DPage() {
  const { internal, external } = useLatestSensorData(30000)
  const [showWireframe, setShowWireframe] = useState(false)
  const [globalOpenAngle, setGlobalOpenAngle] = useState(0)
  const [windowStates, setWindowStates] = useState<Record<string, number>>(
    Object.fromEntries(WINDOWS.map((w) => [w.id, 0]))
  )

  const windows: WindowConfig[] = WINDOWS.map((w) => ({
    ...w,
    openAngle: windowStates[w.id] ?? 0,
  }))

  const handleWindowClick = useCallback((id: string) => {
    setWindowStates((prev) => ({
      ...prev,
      [id]: prev[id] > 5 ? 0 : 45,
    }))
  }, [])

  const handleGlobalAngle = (val: number) => {
    setGlobalOpenAngle(val)
    setWindowStates(Object.fromEntries(WINDOWS.map((w) => [w.id, val])))
  }

  const anyOpen = Object.values(windowStates).some((v) => v > 5)
  const windSpeed = external?.wind_speed ?? 0
  const windLabel = windSpeed < 2 ? 'Calme' : windSpeed < 6 ? 'Faible' : windSpeed < 12 ? 'Modéré' : 'Fort'
  const windColor = windSpeed < 2 ? '#8aaccc' : windSpeed < 6 ? '#00ccff' : windSpeed < 12 ? '#ffaa00' : '#ff6600'
  const tempColor = internal ? tempToColor(internal.temperature).getStyle() : '#00aaff'
  const isRaining = (external?.humidity ?? 0) > 70

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Cursor fix — ensure default cursor on page */}
      <style>{`* { cursor: auto !important; } canvas { cursor: grab; } canvas:active { cursor: grabbing; }`}</style>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#e0e8f8' }}>
            Jumeau Numérique 3D — Serre Fraisier
          </Typography>
          <Typography variant="body2" sx={{ color: '#8aaccc', mt: 0.3 }}>
            3 gouttières × 8.5 m · 80 plants · 6 fenêtres · Capteurs temps réel
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {internal && (
            <Chip label={`${internal.temperature?.toFixed(1)}°C intérieur`} size="small"
              sx={{ bgcolor: `${tempColor}18`, color: tempColor, border: `1px solid ${tempColor}44`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          )}
          <Chip label={`Vent ${windLabel} ${windSpeed.toFixed(1)} m/s`} size="small"
            sx={{ bgcolor: `${windColor}15`, color: windColor, border: `1px solid ${windColor}33`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          {isRaining && (
            <Chip label="🌧 Pluie détectée" size="small"
              sx={{ bgcolor: 'rgba(136,200,255,0.1)', color: '#88ccff', border: '1px solid rgba(136,200,255,0.3)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          )}
          <Chip label={anyOpen ? `${Object.values(windowStates).filter(v => v > 5).length} fenêtre(s) ouverte(s)` : 'Toutes fenêtres fermées'} size="small"
            sx={{ bgcolor: anyOpen ? 'rgba(0,255,136,0.1)' : 'rgba(255,100,100,0.1)', color: anyOpen ? '#00ff88' : '#ff6666', border: `1px solid ${anyOpen ? 'rgba(0,255,136,0.3)' : 'rgba(255,100,100,0.3)'}`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          <FormControlLabel
            control={<Switch size="small" checked={showWireframe} onChange={(e) => setShowWireframe(e.target.checked)} sx={{ '& .MuiSwitch-thumb': { bgcolor: '#00aaff' } }} />}
            label={<Typography variant="caption" sx={{ color: '#8aaccc' }}>Wireframe</Typography>}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flex: 1, overflow: 'hidden' }}>
        {/* Left panel — controls */}
        <Paper sx={{
          width: 220,
          flexShrink: 0,
          p: 2,
          border: '1px solid rgba(0,170,255,0.15)',
          background: 'rgba(6,10,22,0.95)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
        }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
              ◈ Ouverture Globale
            </Typography>
            <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
              Toutes les fenêtres : {globalOpenAngle}°
            </Typography>
            <Slider
              size="small"
              value={globalOpenAngle}
              min={0}
              max={90}
              step={5}
              onChange={(_, v) => handleGlobalAngle(v as number)}
              sx={{
                color: '#00aaff',
                '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-rail': { bgcolor: 'rgba(0,170,255,0.2)' },
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#8aaccc', fontSize: '0.6rem' }}>Fermé</Typography>
              <Typography variant="caption" sx={{ color: '#8aaccc', fontSize: '0.6rem' }}>Ouvert</Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              ◈ Fenêtres Individuelles
            </Typography>
            {WINDOWS.map((w) => {
              const angle = windowStates[w.id] ?? 0
              const isOpen = angle > 5
              return (
                <Box key={w.id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                    <Typography variant="caption" sx={{ color: isOpen ? '#00ff88' : '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                      {w.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isOpen ? '#00ff88' : '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem' }}>
                      {angle}°
                    </Typography>
                  </Box>
                  <Slider
                    size="small"
                    value={angle}
                    min={0}
                    max={90}
                    step={5}
                    onChange={(_, v) => setWindowStates((prev) => ({ ...prev, [w.id]: v as number }))}
                    sx={{
                      color: isOpen ? '#00ff88' : '#334466',
                      py: 0.5,
                      '& .MuiSlider-thumb': { width: 10, height: 10 },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.08)' },
                    }}
                  />
                </Box>
              )
            })}
          </Box>

          {/* Live sensor summary */}
          {internal && (
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                ◈ Capteurs Internes
              </Typography>
              {[
                { label: 'Temp.', value: `${internal.temperature?.toFixed(1)} °C`, color: tempColor },
                { label: 'CO₂', value: `${internal.co2?.toFixed(0)} ppm`, color: '#3b82f6' },
                { label: 'Hum.', value: `${internal.humidity?.toFixed(1)} %`, color: '#06b6d4' },
                { label: 'VPD', value: `${internal.vpd?.toFixed(2)} kPa`, color: '#10b981' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ color: item.color, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 700 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {external && (
            <Box>
              <Typography variant="caption" sx={{ color: '#ffaa00', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                ◈ Station Ext.
              </Typography>
              {[
                { label: 'Vent', value: `${external.wind_speed?.toFixed(1)} m/s`, color: windColor },
                { label: 'Rayonnement', value: `${external.radiation?.toFixed(0)} W/m²`, color: '#f97316' },
                { label: 'Temp. ext.', value: `${external.temperature?.toFixed(1)} °C`, color: '#f59e0b' },
                { label: 'Hum. ext.', value: `${external.humidity?.toFixed(1)} %`, color: '#3b82f6' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>{item.label}</Typography>
                  <Typography variant="caption" sx={{ color: item.color, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 700 }}>{item.value}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* 3D Canvas */}
        <Paper sx={{
          flex: 1,
          overflow: 'hidden',
          border: '1px solid rgba(0,170,255,0.2)',
          position: 'relative',
          cursor: 'default',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,100,200,0.08) 0%, transparent 60%)',
            zIndex: 1,
            pointerEvents: 'none',
          },
        }}>
          <Canvas
            camera={{ position: [9, 7, 15], fov: 52, near: 0.1, far: 100 }}
            gl={{ antialias: true, preserveDrawingBuffer: false }}
            shadows
            style={{ background: 'radial-gradient(ellipse at center, #050f22 0%, #020508 100%)', cursor: 'grab' }}
            onPointerDown={() => { const s = document.querySelector('canvas'); if (s) (s as HTMLElement).style.cursor = 'grabbing' }}
            onPointerUp={() => { const s = document.querySelector('canvas'); if (s) (s as HTMLElement).style.cursor = 'grab' }}
          >
            <Suspense fallback={null}>
              <Scene
                showWireframe={showWireframe}
                windows={windows}
                onWindowClick={handleWindowClick}
              />
            </Suspense>
          </Canvas>

          {/* Airflow status overlay */}
          <AnimatePresence>
            {!anyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 3,
                  background: 'rgba(4,12,30,0.88)',
                  border: '1px solid rgba(255,100,100,0.4)',
                  borderRadius: 8,
                  padding: '6px 16px',
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="caption" sx={{ color: '#ff8888', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem' }}>
                  ✕ Toutes les fenêtres sont fermées — aucun flux d'air
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Temperature legend */}
          <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 2 }}>
            <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.8 }}>
              Température / Flux d'air
            </Typography>
            {[
              { label: '< 10 °C', color: '#0033ff' },
              { label: '10–15 °C', color: '#0066ff' },
              { label: '15–20 °C', color: '#00aaff' },
              { label: '20–25 °C', color: '#00ffaa' },
              { label: '25–30 °C', color: '#ffaa00' },
              { label: '30–35 °C', color: '#ff6600' },
              { label: '> 35 °C', color: '#ff2200' },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color, boxShadow: `0 0 5px ${item.color}88`, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Wind indicator */}
          {external && (
            <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: windColor, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>
                💨 {external.wind_speed?.toFixed(1)} m/s
              </Typography>
              <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', display: 'block' }}>
                Vent {windLabel}
              </Typography>
              {isRaining && (
                <Typography variant="caption" sx={{ color: '#88ccff', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', display: 'block', mt: 0.5 }}>
                  🌧 Humidité {external.humidity?.toFixed(0)}%
                </Typography>
              )}
            </Box>
          )}

          {/* Hint */}
          <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(138,172,204,0.6)', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem' }}>
              🖱 Rotation · Scroll: Zoom · Cliquer capteur: Données
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}