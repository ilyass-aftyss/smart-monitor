// ═══════════════════════════════════════════════════════════════════════════════
//  Visualization3D.tsx  —  Jumeau numérique 3D · Serre Fraisier
//
//  MODÈLE 3D : "Farmer Greenhouse 3.5x6.0x2.03m 40x20/20x20"
//  Source    : https://sketchfab.com/3d-models/farmer-greenhouse-35x60x203m-40x2020x20-b032e046389a4194bf6a032620b977a3
//  Auteur    : MinorEarth (https://sketchfab.com/sanx78)
//  Licence   : CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/)
//
//  PLACEMENT DES FICHIERS (voir section « Où placer le ZIP » en bas) :
//    public/models/greenhouse/scene.gltf
//    public/models/greenhouse/scene.bin
//    public/models/greenhouse/textures/AppAA4_0_baseColor.jpeg
//    public/models/greenhouse/textures/AppAA4_1_baseColor.jpeg
// ═══════════════════════════════════════════════════════════════════════════════

import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, ThreeEvent, useLoader } from '@react-three/fiber'
import { OrbitControls, Text, Float, Sparkles, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Box, Typography, Paper, Chip, CircularProgress, Slider, FormControlLabel, Switch, IconButton } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'

// ─── Chemin public vers le modèle GLTF ─────────────────────────────────────────
// Placez les fichiers extraits du ZIP dans : public/models/greenhouse/
const GREENHOUSE_GLTF_PATH = '/models/greenhouse/scene.gltf'

// ─── Constants scène (doivent précéder les calculs d'échelle) ─────────────────
const W = 5     // largeur  (X)  m
const L = 10    // longueur (Z)  m
const H = 3     // hauteur mur   m

// ─── Dimensions natives exactes du modèle GLTF (accesseurs positions) ──────────
// X: [-1.819, 1.819] → width = 3.638 m
// Y: [-2.035, 0.182] → height = 2.217 m
// Z: [-6.030, 0.060] → length = 6.090 m
const MODEL_NATIVE_W = 3.638
const MODEL_NATIVE_H = 2.217
const MODEL_NATIVE_L = 6.090
const MODEL_FLOOR_Y  = -2.035
const MODEL_Z_CENTER = (-6.030 + 0.060) / 2  // -2.985

// ─── Échelle et position pour coller à W=5, H=3, L=10 ─────────────────────────
const MODEL_SCALE_X = W / MODEL_NATIVE_W
const MODEL_SCALE_Y = H / MODEL_NATIVE_H
const MODEL_SCALE_Z = L / MODEL_NATIVE_L
const MODEL_Y_OFFSET = -MODEL_FLOOR_Y * MODEL_SCALE_Y
const MODEL_Z_OFFSET = -MODEL_Z_CENTER * MODEL_SCALE_Z
// ─── Ajustements manuels (tuning visuel) ────────────────────────────────────
const TUNE_Y = -2.5   // descendre (négatif) ou monter (positif)
const TUNE_Z = -9.80     // reculer (négatif) ou avancer (positif)
const TUNE_X = 0.10      // décalage latéral (dans l'axe X)
const RIDGE_H = H + 1.2

const GUTTER_LENGTH = 8.5
const GUTTER_HEIGHT = 1.0
const GUTTER_POSITIONS_X = [-1.25, 0, 1.25]
const PLANTS_PER_GUTTER = 27
const PLANT_SPACING = GUTTER_LENGTH / (PLANTS_PER_GUTTER - 1)

// ─── Couleur en fonction de la température ──────────────────────────────────────
function tempToColor(temp: number): THREE.Color {
  if (temp < 10) return new THREE.Color('#0033ff')
  if (temp < 15) return new THREE.Color('#0066ff')
  if (temp < 20) return new THREE.Color('#00aaff')
  if (temp < 25) return new THREE.Color('#00ffaa')
  if (temp < 30) return new THREE.Color('#ffaa00')
  if (temp < 35) return new THREE.Color('#ff6600')
  return new THREE.Color('#ff2200')
}

// ─── Interfaces fenêtres ────────────────────────────────────────────────────────
interface WindowConfig {
  id: string
  label: string
  position: [number, number, number]
  rotation: [number, number, number]
  side: 'south' | 'north'
  row: 'upper' | 'lower'
  openAngle: number
}

// Les fenêtres sont des overlays React Three Fiber positionnés sur la structure GLTF
// Positions ajustées pour coller aux parois du nouveau modèle
const WINDOWS: WindowConfig[] = [
  { id: 'w-s-l-1', label: 'Fenêtre S1', position: [-1.5, 1.0, L / 2], rotation: [0, 0, 0],        side: 'south', row: 'lower', openAngle: 0 },
  { id: 'w-s-l-2', label: 'Fenêtre S2', position: [ 0,   1.0, L / 2], rotation: [0, 0, 0],        side: 'south', row: 'lower', openAngle: 0 },
  { id: 'w-s-l-3', label: 'Fenêtre S3', position: [ 1.5, 1.0, L / 2], rotation: [0, 0, 0],        side: 'south', row: 'lower', openAngle: 0 },
  { id: 'w-n-u-1', label: 'Fenêtre N1', position: [-1.5, 2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
  { id: 'w-n-u-2', label: 'Fenêtre N2', position: [ 0,   2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
  { id: 'w-n-u-3', label: 'Fenêtre N3', position: [ 1.5, 2.2, -L / 2], rotation: [0, Math.PI, 0], side: 'north', row: 'upper', openAngle: 0 },
]

// ─── Capteurs ──────────────────────────────────────────────────────────────────
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
      { label: 'Humidité',    value: `${d.humidity?.toFixed(1)} %` },
      { label: 'CO₂',        value: `${d.co2?.toFixed(0)} ppm` },
      { label: 'VPD',        value: `${d.vpd?.toFixed(2)} kPa` },
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
      { label: 'Humidité',    value: `${d.humidity?.toFixed(1)} %` },
      { label: 'VPD',        value: `${d.vpd?.toFixed(2)} kPa` },
      { label: 'VOC',        value: `${d.voc?.toFixed(0)} ppb` },
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
      { label: 'Humidité',    value: `${d.humidity?.toFixed(1)} %` },
      { label: 'Pression',   value: `${d.pressure?.toFixed(0)} hPa` },
      { label: 'Pt. Rosée',  value: `${d.dew_point?.toFixed(1)} °C` },
    ],
  },
  {
    id: 'sensor-ext',
    label: 'Station Ext.',
    position: [W / 2 + 1.2, 1.5, 0],
    color: '#f97316',
    zone: 'Extérieur',
    getValue: (d) => [
      { label: 'Temp. Ext',  value: `${d.temperature?.toFixed(1)} °C` },
      { label: 'Hum. Ext',   value: `${d.humidity?.toFixed(1)} %` },
      { label: 'Vent',       value: `${d.wind_speed?.toFixed(1)} m/s` },
      { label: 'Radiation',  value: `${d.radiation?.toFixed(0)} W/m²` },
    ],
  },
]

// ─── Flux d'air (particules wavy, colorées par température) ────────────────────
function AirflowParticles({
  windSpeed, extTemp, intTemp, windowsOpen, allClosed,
}: {
  windSpeed: number; extTemp: number; intTemp: number
  windowsOpen: boolean; allClosed: boolean
}) {
  const lineCount = allClosed ? 0 : Math.min(Math.round(windSpeed * 2.5 + 3), 18)
  const pointsPerLine = 60

  const hexColor = useMemo(() => {
    const c = tempToColor(extTemp)
    return '#' + c.getHexString()
  }, [extTemp])

  const laneConfig = useMemo(() =>
    Array.from({ length: 18 }).map((_, i) => ({
      y: 0.25 + (i / 17) * (H - 0.5),
      xOff: (Math.random() - 0.5) * (W * 0.85),
      phase: Math.random() * Math.PI * 2,
      ampY: 0.06 + Math.random() * 0.10,
      ampX: 0.05 + Math.random() * 0.07,
      speedMul: 0.7 + Math.random() * 0.6,
    })), [])

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
        const progress = j / pointsPerLine
        const zPos = -L / 2 + ((progress * L + t * baseSpeed * cfg.speedMul) % L)
        const xPos = cfg.xOff + Math.sin(progress * Math.PI * 5 + t * 2.2 + cfg.phase) * cfg.ampX
        const yPos = cfg.y + Math.sin(progress * Math.PI * 7 + t * 1.8 + cfg.phase * 1.3) * cfg.ampY
        const idx = j * 3
        pos[idx] = xPos; pos[idx + 1] = yPos; pos[idx + 2] = zPos
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

// ─── Pluie ──────────────────────────────────────────────────────────────────────
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

// ─── Fenêtre (panneau animé superposé au modèle GLTF) ──────────────────────────
function GreenhouseWindow({
  config, openAngle, onClick,
}: {
  config: WindowConfig; openAngle: number; onClick: () => void
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
      <mesh onClick={onClick}>
        <boxGeometry args={[0.7, 0.6, 0.04]} />
        <meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.15}
          metalness={0.8} roughness={0.2} transparent opacity={0.0} />
      </mesh>
      <group position={[0, -0.3, 0]}>
        <mesh ref={panelRef} position={[0, 0.3, 0.02]}>
          <boxGeometry args={[0.65, 0.55, 0.015]} />
          <meshStandardMaterial color={glassColor} transparent opacity={0.35}
            metalness={0.1} roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
      </group>
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
      {isOpen && <pointLight color="#00ff88" intensity={0.3} distance={1.5} />}
      <Text position={[0, -0.5, 0.05]} fontSize={0.07} color={isOpen ? '#00ff88' : '#8aaccc'} anchorX="center">
        {config.label} {isOpen ? `${openAngle}°` : 'fermée'}
      </Text>
    </group>
  )
}

// ─── Icônes capteurs ────────────────────────────────────────────────────────────
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

// ─── Nœud capteur cliquable ─────────────────────────────────────────────────────
function SensorNode({
  config, data, selected, onSelect,
}: {
  config: SensorConfig; data: any; selected: boolean; onSelect: () => void
}) {
  const bodyRef = useRef<THREE.Mesh>(null)
  const ledRef  = useRef<THREE.Mesh>(null)
  const readings = data ? config.getValue(data) : []

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
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
      {!isExternal && (
        <>
          <mesh position={[0, -config.position[1] / 2 - 0.05, 0]}>
            <cylinderGeometry args={[0.012, 0.012, config.position[1] + 0.1, 8]} />
            <meshStandardMaterial color="#334466" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, -config.position[1] + 0.02, 0]}>
            <cylinderGeometry args={[0.055, 0.07, 0.04, 12]} />
            <meshStandardMaterial color="#222244" metalness={0.8} roughness={0.3} />
          </mesh>
        </>
      )}
      <mesh ref={bodyRef} castShadow>
        <boxGeometry args={[0.18, 0.24, 0.12]} />
        <meshStandardMaterial
          color={selected ? config.color : '#1a2a3a'}
          emissive={config.color}
          emissiveIntensity={selected ? 0.35 : 0.08}
          metalness={0.6} roughness={0.35}
        />
      </mesh>
      <mesh position={[0, 0, 0.063]}>
        <boxGeometry args={[0.155, 0.21, 0.008]} />
        <meshStandardMaterial color="#0d1a28" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.03, 0.069]}>
        <boxGeometry args={[0.12, 0.11, 0.003]} />
        <meshStandardMaterial color={config.color} emissive={config.color}
          emissiveIntensity={selected ? 0.6 : 0.15} transparent opacity={0.85} />
      </mesh>
      {[-0.04, 0, 0.04].map((x, i) => (
        <mesh key={i} position={[x, -0.075, 0.068]}>
          <cylinderGeometry args={[0.008, 0.008, 0.006, 8]} />
          <meshStandardMaterial color="#334455" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh ref={ledRef} position={[0.06, 0.085, 0.069]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={0.8} />
      </mesh>
      {[0.04, 0.02, 0, -0.02, -0.04].map((y, i) => (
        <mesh key={i} position={[0.092, y, 0]}>
          <boxGeometry args={[0.003, 0.012, 0.08]} />
          <meshStandardMaterial color="#0a1520" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0.055, 0.19, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
        <meshStandardMaterial color={config.color} emissive={config.color}
          emissiveIntensity={0.5} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0.055, 0.285, 0]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshStandardMaterial color={config.color} emissive={config.color} emissiveIntensity={1.2} />
      </mesh>
      <Text position={[0, -0.18, 0.07]} fontSize={0.065} color={selected ? config.color : '#8aaccc'}
        anchorX="center" anchorY="top">
        {config.label}
      </Text>
      {selected && <PulsingHalo color={config.color} />}
      <pointLight color={config.color} intensity={selected ? 1.0 : 0.25} distance={selected ? 3.0 : 1.8} />
      {selected && data && (
        <Html position={[0.45, 0.3, 0]} distanceFactor={3.8} occlude={false}
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            fontFamily: '"JetBrains Mono", "Courier New", monospace',
            minWidth: 210,
            filter: 'drop-shadow(0 0 18px ' + config.color + '55)',
          }}>
            <div style={{
              background: config.color, borderRadius: '10px 10px 0 0',
              padding: '8px 14px 6px', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', boxShadow: '0 0 6px white' }} />
              <span style={{ color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {config.zone}
              </span>
              <span style={{ marginLeft: 'auto', color: 'rgba(0,0,0,0.6)', fontSize: 9 }}>{config.label}</span>
            </div>
            <div style={{
              background: 'rgba(4, 10, 24, 0.97)', border: `1px solid ${config.color}55`,
              borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '10px 14px 10px',
            }}>
              {readings.map((r, idx) => (
                <div key={r.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: idx < readings.length - 1 ? 8 : 0,
                  paddingBottom: idx < readings.length - 1 ? 8 : 0,
                  borderBottom: idx < readings.length - 1 ? `1px solid ${config.color}22` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{sensorIcon(r.label)}</span>
                    <span style={{ color: '#8aaccc', fontSize: 10 }}>{r.label}</span>
                  </div>
                  <span style={{ color: config.color, fontSize: 13, fontWeight: 800,
                    textShadow: `0 0 8px ${config.color}`, letterSpacing: '0.03em' }}>
                    {r.value}
                  </span>
                </div>
              ))}
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.color, boxShadow: `0 0 6px ${config.color}` }} />
                <span style={{ color: '#8aaccc', fontSize: 9, letterSpacing: '0.06em' }}>TEMPS RÉEL · Cliquer pour fermer</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Plante fraisier ─────────────────────────────────────────────────────────────
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

// ─── Heatmap température (brume intérieure) ─────────────────────────────────────
function TempHeatmap({ temp }: { temp: number }) {
  const col = tempToColor(temp)
  return (
    <>
      <mesh position={[0, H - 0.3, 0]}>
        <boxGeometry args={[W - 0.3, 0.5, L - 0.3]} />
        <meshStandardMaterial color={col} transparent opacity={0.03} />
      </mesh>
      <mesh position={[0, GUTTER_HEIGHT + 0.2, 0]}>
        <boxGeometry args={[W - 0.4, 0.3, L - 0.4]} />
        <meshStandardMaterial color={col} transparent opacity={0.025} />
      </mesh>
    </>
  )
}

// ─── MODÈLE GLTF — Serre professionnelle ────────────────────────────────────────
// Chargement paresseux du modèle GLTF avec useGLTF (drei)
// Le modèle est préchargé en dehors du composant pour éviter les rechargements
useGLTF.preload(GREENHOUSE_GLTF_PATH)

function GreenhouseGLTFModel({ showWireframe }: { showWireframe: boolean }) {
  const { scene } = useGLTF(GREENHOUSE_GLTF_PATH)

  // Clone pour éviter les mutations d'état partagé si plusieurs instances
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    // Appliquer les matériaux wireframe si activé
    c.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        // Activer les ombres sur le modèle
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (showWireframe) {
          // En mode wireframe, ajouter une teinte bleu-cyan
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone()
          mat.wireframe = true
          mat.color = new THREE.Color('#00aaff')
          mesh.material = mat
        }
      }
    })
    return c
  }, [scene, showWireframe])

  return (
    <primitive
      object={cloned}
      // Alignement du modèle GLTF :
      //   X → largeur (W=5), Y → hauteur (H=3), Z → longueur (L=10)
      // Le modèle natif a Y_min ≈ -2.035 (sol) et Z centre ≈ -2.985
      // On translate pour que le sol soit à Y=0 et le centre à Z=0
      position={[TUNE_X, MODEL_Y_OFFSET + TUNE_Y, MODEL_Z_OFFSET + TUNE_Z]}
      rotation={[0, 0, 0]}
      scale={[MODEL_SCALE_X, MODEL_SCALE_Y, MODEL_SCALE_Z]}
    />
  )
}

// Fallback pendant le chargement GLTF
function GreenhouseFallback() {
  return (
    <mesh position={[0, H / 2, 0]}>
      <boxGeometry args={[W, H, L]} />
      <meshStandardMaterial color="#1a3d7a" transparent opacity={0.18} wireframe />
    </mesh>
  )
}

// ─── Scène principale ───────────────────────────────────────────────────────────
function Scene({
  showWireframe, windows, onWindowClick,
}: {
  showWireframe: boolean; windows: WindowConfig[]; onWindowClick: (id: string) => void
}) {
  const { internal, external } = useLatestSensorData(30000)
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null)

  const tempColor = internal ? tempToColor(internal.temperature) : new THREE.Color('#00aaff')
  const windSpeed = external?.wind_speed ?? 2
  const extTemp   = external?.temperature ?? 18
  const extHumidity = external?.humidity ?? 60

  const anyOpen = windows.some((w) => w.openAngle > 5)
  const allClosed = !anyOpen

  return (
    <>
      {/* Éclairage */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 9, 6]} intensity={1.2} color="#ffffff" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, 6, 0]} intensity={0.8} color="#0066aa" />
      <hemisphereLight args={['#0a1f4a', '#000510', 0.5]} />

      {/* Sparkles ambiants */}
      <Sparkles count={60} scale={[W, 4, L]} size={0.6} speed={0.2} color="#00aaff" opacity={0.2} />

      {/* ─── MODÈLE GLTF — SERRE PROFESSIONNELLE ─── */}
      <Suspense fallback={<GreenhouseFallback />}>
        <GreenhouseGLTFModel showWireframe={showWireframe} />
      </Suspense>

      {/* Sol */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 4, L + 4]} />
        <meshStandardMaterial color="#050e1f" roughness={1} metalness={0} />
      </mesh>

      {/* Grille de sol */}
      <gridHelper args={[Math.max(W, L) + 4, 14, '#001166', '#000d44']} position={[0, 0.005, 0]} />

      {/* Heatmap température */}
      {internal && <TempHeatmap temp={internal.temperature} />}

      {/* Gouttières de culture */}
      <GutterStructure />

      {/* Fenêtres (overlays animés) */}
      {windows.map((win) => (
        <GreenhouseWindow
          key={win.id}
          config={win}
          openAngle={win.openAngle}
          onClick={() => onWindowClick(win.id)}
        />
      ))}

      {/* Flux d'air */}
      <AirflowParticles
        windSpeed={windSpeed}
        extTemp={extTemp}
        intTemp={internal?.temperature ?? 20}
        windowsOpen={anyOpen}
        allClosed={allClosed}
      />

      {/* Pluie */}
      <RainSystem humidity={extHumidity} windSpeed={windSpeed} />

      {/* Capteurs internes */}
      {internal && SENSOR_CONFIGS.slice(0, 3).map((cfg) => (
        <SensorNode
          key={cfg.id}
          config={cfg}
          data={internal}
          selected={selectedSensor === cfg.id}
          onSelect={() => setSelectedSensor((s) => s === cfg.id ? null : cfg.id)}
        />
      ))}

      {/* Station extérieure */}
      {external && (
        <SensorNode
          config={SENSOR_CONFIGS[3]}
          data={external}
          selected={selectedSensor === SENSOR_CONFIGS[3].id}
          onSelect={() => setSelectedSensor((s) => s === SENSOR_CONFIGS[3].id ? null : SENSOR_CONFIGS[3].id)}
        />
      )}

      <OrbitControls
        enablePan enableZoom enableRotate
        minDistance={4} maxDistance={28}
        maxPolarAngle={Math.PI / 1.85}
        target={[0, 1.5, 0]}
        dampingFactor={0.06}
        enableDamping
      />
    </>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────────
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
  const windSpeed  = external?.wind_speed ?? 0
  const windLabel  = windSpeed < 2 ? 'Calme' : windSpeed < 6 ? 'Faible' : windSpeed < 12 ? 'Modéré' : 'Fort'
  const windColor  = windSpeed < 2 ? '#8aaccc' : windSpeed < 6 ? '#00ccff' : windSpeed < 12 ? '#ffaa00' : '#ff6600'
  const tempColor  = internal ? tempToColor(internal.temperature).getStyle() : '#00aaff'
  const isRaining  = (external?.humidity ?? 0) > 70

  return (
    <Box sx={{ height: 'calc(100vh - 110px)', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <style>{`* { cursor: auto !important; } canvas { cursor: grab; } canvas:active { cursor: grabbing; }`}</style>

      {/* En-tête */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#e0e8f8' }}>
            Jumeau Numérique 3D — Serre Fraisier
          </Typography>
          <Typography variant="body2" sx={{ color: '#8aaccc', mt: 0.3 }}>
            3 gouttières × 8.5 m · 80 plants · 6 fenêtres · Capteurs temps réel ·{' '}
            <span style={{ opacity: 0.55, fontSize: '0.75rem' }}>
              Modèle : MinorEarth / Sketchfab (CC-BY-4.0)
            </span>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {internal && (
            <Chip label={`${internal.temperature?.toFixed(1)}°C intérieur`} size="small"
              sx={{ bgcolor: `${tempColor}18`, color: tempColor, border: `1px solid ${tempColor}44`,
                fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          )}
          <Chip label={`Vent ${windLabel} ${windSpeed.toFixed(1)} m/s`} size="small"
            sx={{ bgcolor: `${windColor}15`, color: windColor, border: `1px solid ${windColor}33`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          {isRaining && (
            <Chip label="🌧 Pluie détectée" size="small"
              sx={{ bgcolor: 'rgba(136,200,255,0.1)', color: '#88ccff', border: '1px solid rgba(136,200,255,0.3)',
                fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          )}
          <Chip
            label={anyOpen
              ? `${Object.values(windowStates).filter(v => v > 5).length} fenêtre(s) ouverte(s)`
              : 'Toutes fenêtres fermées'}
            size="small"
            sx={{ bgcolor: anyOpen ? 'rgba(0,255,136,0.1)' : 'rgba(255,100,100,0.1)',
              color: anyOpen ? '#00ff88' : '#ff6666',
              border: `1px solid ${anyOpen ? 'rgba(0,255,136,0.3)' : 'rgba(255,100,100,0.3)'}`,
              fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          <FormControlLabel
            control={<Switch size="small" checked={showWireframe}
              onChange={(e) => setShowWireframe(e.target.checked)}
              sx={{ '& .MuiSwitch-thumb': { bgcolor: '#00aaff' } }} />}
            label={<Typography variant="caption" sx={{ color: '#8aaccc' }}>Wireframe</Typography>}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, flex: 1, overflow: 'hidden' }}>
        {/* Panneau gauche */}
        <Paper sx={{
          width: 220, flexShrink: 0, p: 2,
          border: '1px solid rgba(0,170,255,0.15)',
          background: 'rgba(6,10,22,0.95)',
          display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto',
        }}>
          {/* Ouverture globale */}
          <Box>
            <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1.5 }}>
              ◈ Ouverture Globale
            </Typography>
            <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
              Toutes les fenêtres : {globalOpenAngle}°
            </Typography>
            <Slider size="small" value={globalOpenAngle} min={0} max={90} step={5}
              onChange={(_, v) => handleGlobalAngle(v as number)}
              sx={{ color: '#00aaff', '& .MuiSlider-thumb': { width: 12, height: 12 },
                '& .MuiSlider-rail': { bgcolor: 'rgba(0,170,255,0.2)' } }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#8aaccc', fontSize: '0.6rem' }}>Fermé</Typography>
              <Typography variant="caption" sx={{ color: '#8aaccc', fontSize: '0.6rem' }}>Ouvert</Typography>
            </Box>
          </Box>

          {/* Fenêtres individuelles */}
          <Box>
            <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
              ◈ Fenêtres Individuelles
            </Typography>
            {WINDOWS.map((w) => {
              const angle = windowStates[w.id] ?? 0
              const isOpen = angle > 5
              return (
                <Box key={w.id} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                    <Typography variant="caption" sx={{ color: isOpen ? '#00ff88' : '#8aaccc',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                      {w.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: isOpen ? '#00ff88' : '#8aaccc',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: '0.6rem' }}>
                      {angle}°
                    </Typography>
                  </Box>
                  <Slider size="small" value={angle} min={0} max={90} step={5}
                    onChange={(_, v) => setWindowStates((prev) => ({ ...prev, [w.id]: v as number }))}
                    sx={{ color: isOpen ? '#00ff88' : '#334466', py: 0.5,
                      '& .MuiSlider-thumb': { width: 10, height: 10 },
                      '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.08)' } }} />
                </Box>
              )
            })}
          </Box>

          {/* Résumé capteurs */}
          {internal && (
            <Box sx={{ mt: 'auto' }}>
              <Typography variant="caption" sx={{ color: '#00aaff', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                ◈ Capteurs Internes
              </Typography>
              {[
                { label: 'Temp.', value: `${internal.temperature?.toFixed(1)} °C`, color: tempColor },
                { label: 'CO₂',  value: `${internal.co2?.toFixed(0)} ppm`, color: '#3b82f6' },
                { label: 'Hum.', value: `${internal.humidity?.toFixed(1)} %`, color: '#06b6d4' },
                { label: 'VPD',  value: `${internal.vpd?.toFixed(2)} kPa`, color: '#10b981' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: item.color, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {external && (
            <Box>
              <Typography variant="caption" sx={{ color: '#ffaa00', fontFamily: '"JetBrains Mono", monospace',
                fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 1 }}>
                ◈ Station Ext.
              </Typography>
              {[
                { label: 'Vent',        value: `${external.wind_speed?.toFixed(1)} m/s`, color: windColor },
                { label: 'Rayonnement', value: `${external.radiation?.toFixed(0)} W/m²`, color: '#f97316' },
                { label: 'Temp. ext.',  value: `${external.temperature?.toFixed(1)} °C`, color: '#f59e0b' },
                { label: 'Hum. ext.',   value: `${external.humidity?.toFixed(1)} %`,     color: '#3b82f6' },
              ].map((item) => (
                <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: item.color, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem', fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Canvas 3D */}
        <Paper sx={{
          flex: 1, overflow: 'hidden', border: '1px solid rgba(0,170,255,0.2)',
          position: 'relative', cursor: 'default',
          '&::before': {
            content: '""', position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,100,200,0.08) 0%, transparent 60%)',
            zIndex: 1, pointerEvents: 'none',
          },
        }}>
          <Canvas
            camera={{ position: [10, 7, 16], fov: 50, near: 0.1, far: 150 }}
            gl={{ antialias: true, preserveDrawingBuffer: false }}
            shadows
            style={{ background: 'radial-gradient(ellipse at center, #050f22 0%, #020508 100%)', cursor: 'grab' }}
            onPointerDown={() => { const s = document.querySelector('canvas'); if (s) (s as HTMLElement).style.cursor = 'grabbing' }}
            onPointerUp={  () => { const s = document.querySelector('canvas'); if (s) (s as HTMLElement).style.cursor = 'grab' }}
          >
            <Suspense fallback={null}>
              <Scene showWireframe={showWireframe} windows={windows} onWindowClick={handleWindowClick} />
            </Suspense>
          </Canvas>

          {/* Overlay : fenêtres toutes fermées */}
          <AnimatePresence>
            {!anyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                style={{
                  position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 3, background: 'rgba(4,12,30,0.88)',
                  border: '1px solid rgba(255,100,100,0.4)', borderRadius: 8, padding: '6px 16px', pointerEvents: 'none',
                }}>
                <Typography variant="caption" sx={{ color: '#ff8888', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.68rem' }}>
                  ✕ Toutes les fenêtres sont fermées — aucun flux d'air
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Légende température */}
          <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 2 }}>
            <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', mb: 0.8 }}>
              Température / Flux d'air
            </Typography>
            {[
              { label: '< 10 °C',   color: '#0033ff' },
              { label: '10–15 °C',  color: '#0066ff' },
              { label: '15–20 °C',  color: '#00aaff' },
              { label: '20–25 °C',  color: '#00ffaa' },
              { label: '25–30 °C',  color: '#ffaa00' },
              { label: '30–35 °C',  color: '#ff6600' },
              { label: '> 35 °C',   color: '#ff2200' },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color,
                  boxShadow: `0 0 5px ${item.color}88`, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.62rem' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Indicateur vent */}
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

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║  OÙ PLACER LES FICHIERS DU ZIP                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  Extrayez le fichier ZIP et copiez les fichiers ainsi :                      ║
║                                                                              ║
║  votre-projet/                                                               ║
║  └── public/                                                                 ║
║      └── models/                                                             ║
║          └── greenhouse/              ← créez ce dossier                    ║
║              ├── scene.gltf           ← fichier principal                   ║
║              ├── scene.bin            ← géométrie binaire (obligatoire)     ║
║              └── textures/                                                   ║
║                  ├── AppAA4_0_baseColor.jpeg                                 ║
║                  └── AppAA4_1_baseColor.jpeg                                 ║
║                                                                              ║
║  IMPORTANT : scene.bin ET scene.gltf DOIVENT être dans le même dossier.    ║
║  Le GLTF référence le .bin par chemin relatif.                              ║
║                                                                              ║
║  Commande rapide depuis la racine du projet (Linux/Mac) :                   ║
║    mkdir -p public/models/greenhouse                                         ║
║    unzip farmer_greenhouse_*.zip -d public/models/greenhouse/                ║
║                                                                              ║
║  LICENCE : Ce modèle est sous CC-BY-4.0.                                    ║
║  Crédit à inclure dans votre app/documentation :                            ║
║    "Farmer Greenhouse 3.5x6.0x2.03m 40x20/20x20" par MinorEarth            ║
║    https://sketchfab.com/3d-models/farmer-greenhouse-35x60x203m-...         ║
║    Licence CC-BY-4.0                                                         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/
