import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Float, Sparkles, Grid } from '@react-three/drei'
import * as THREE from 'three'
import { Box, Typography, Paper, Chip, CircularProgress, Slider, FormControlLabel, Switch } from '@mui/material'
import { motion } from 'framer-motion'
import { useLatestSensorData } from '../hooks/useSensorData'
import { devicesApi } from '../services/api'
import type { Device } from '../types'

function tempToColor(temp: number) {
  if (temp < 15) return new THREE.Color('#0066ff')
  if (temp < 22) return new THREE.Color('#00aaff')
  if (temp < 28) return new THREE.Color('#00ff88')
  if (temp < 33) return new THREE.Color('#ffaa00')
  return new THREE.Color('#ff3344')
}

function humidToColor(hum: number) {
  if (hum < 40) return new THREE.Color('#ffaa44')
  if (hum < 70) return new THREE.Color('#00ccff')
  return new THREE.Color('#0044ff')
}

// Animated Fan Blade
function FanBlades({ spinning, color }: { spinning: boolean; color: string }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += spinning ? delta * 8 : 0
  })
  return (
    <group ref={ref}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 0.04, 0.12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

function Fan({ position, status, name }: { position: [number, number, number]; status: string; name: string }) {
  const spinning = status === 'ON'
  const errorState = status === 'Erreur'
  const color = spinning ? '#00ff88' : errorState ? '#ff3344' : '#555577'
  const glowColor = spinning ? '#00ff88' : errorState ? '#ff3344' : '#444466'

  const housingRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (housingRef.current && errorState) {
      housingRef.current.material = new THREE.MeshStandardMaterial({
        color: '#ff3344',
        emissive: '#ff0000',
        emissiveIntensity: Math.sin(clock.getElapsedTime() * 8) * 0.5 + 0.5,
      })
    }
  })

  return (
    <group position={position}>
      {/* Housing ring */}
      <mesh ref={housingRef}>
        <torusGeometry args={[0.22, 0.035, 12, 32]} />
        <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0.4} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Fan blades */}
      <FanBlades spinning={spinning} color={color} />
      {/* Center hub */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, 0.05, 16]} />
        <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0.5} metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Point light glow */}
      {spinning && <pointLight color="#00ff88" intensity={0.4} distance={1.2} />}
      {errorState && <pointLight color="#ff3344" intensity={0.6} distance={1.2} />}
      {/* Label */}
      <Text
        position={[0, -0.35, 0]}
        fontSize={0.09}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {name.split(' ').slice(-2).join(' ')}
      </Text>
      <Text position={[0, -0.47, 0]} fontSize={0.07} color="#8aaccc" anchorX="center" anchorY="middle">
        {status}
      </Text>
    </group>
  )
}

function SensorNode({ position, value, unit, label, color }: { position: [number, number, number]; value: number; unit: string; label: string; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const col = new THREE.Color(color)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
      ;(meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.2
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0} floatIntensity={0.3}>
      <group position={position}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[0.12, 0]} />
          <meshStandardMaterial color={col} emissive={col} emissiveIntensity={0.4} metalness={0.5} roughness={0.3} />
        </mesh>
        <pointLight color={col} intensity={0.3} distance={1.5} />
        <Text position={[0, 0.22, 0]} fontSize={0.1} color={color} anchorX="center" fontWeight={700}>
          {value.toFixed(1)}{unit}
        </Text>
        <Text position={[0, 0.33, 0]} fontSize={0.07} color="#8aaccc" anchorX="center">
          {label}
        </Text>
      </group>
    </Float>
  )
}

// Greenhouse real dimensions: Width = 5 m (X axis), Length = 10 m (Z axis), Height = 3 m (Y axis)
// 1 Three.js unit = 1 metre
const W = 5    // width
const L = 10   // length
const H = 3    // wall height

// ─── Gouttières de culture ────────────────────────────────────────────────────
// 3 lignes de 8.5 m, suspendues à 1.0 m de hauteur, espacées de 1.25 m en X
// 80 plants au total (~27 par ligne)
const GUTTER_LENGTH = 8.5
const GUTTER_HEIGHT = 1.0
const GUTTER_POSITIONS_X = [-1.25, 0, 1.25]
const PLANTS_PER_GUTTER  = 27
const PLANT_SPACING      = GUTTER_LENGTH / (PLANTS_PER_GUTTER - 1)

function StrawberryPlant({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + 0.05 * Math.sin(clock.getElapsedTime() * 0.8 + position[0] * 3 + position[2])
    }
  })
  return (
    <group position={position}>
      {/* Feuilles */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.06, 6, 4]} />
        <meshStandardMaterial color="#22aa44" emissive="#114422" emissiveIntensity={0.3} roughness={0.8} />
      </mesh>
      {/* Petite fraise (visible seulement sur certains plants) */}
      {Math.abs(position[2] % 0.9) < 0.3 && (
        <mesh position={[0.04, -0.05, 0.04]}>
          <sphereGeometry args={[0.025, 5, 4]} />
          <meshStandardMaterial color="#dd2244" emissive="#880011" emissiveIntensity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function CultureGutter({ posX }: { posX: number }) {
  return (
    <group position={[posX, GUTTER_HEIGHT, 0]}>
      {/* Corps de la gouttière — PVC blanc, 8.5 m */}
      <mesh>
        <boxGeometry args={[0.08, 0.06, GUTTER_LENGTH]} />
        <meshStandardMaterial color="#dde8f0" metalness={0.1} roughness={0.7} />
      </mesh>
      {/* Substrat fibre de coco visible dans la gouttière */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.06, 0.02, GUTTER_LENGTH - 0.1]} />
        <meshStandardMaterial color="#8B6914" roughness={1} />
      </mesh>
      {/* Plants de fraisier */}
      {Array.from({ length: PLANTS_PER_GUTTER }).map((_, i) => (
        <StrawberryPlant
          key={i}
          position={[0, 0.07, -GUTTER_LENGTH / 2 + i * PLANT_SPACING]}
        />
      ))}
      {/* Tuyau de goutte-à-goutte */}
      <mesh position={[0.05, 0.04, 0]}>
        <cylinderGeometry args={[0.008, 0.008, GUTTER_LENGTH, 6]} />
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
          {/* Supports métalliques tous les 2 m */}
          {[-3, -1, 1, 3].map((z) => (
            <group key={z} position={[x, 0, z]}>
              {/* Colonne verticale */}
              <mesh position={[0, GUTTER_HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.02, 0.02, GUTTER_HEIGHT, 8]} />
                <meshStandardMaterial color="#aaaacc" metalness={0.8} roughness={0.2} />
              </mesh>
              {/* Base */}
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
                <meshStandardMaterial color="#888899" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Label 3D */}
      <Text position={[0, GUTTER_HEIGHT + 0.5, -GUTTER_LENGTH / 2 - 0.3]} fontSize={0.09} color="#00ff88" anchorX="center">
        {`3 lignes × 8.5 m — 80 plants (Fibre de coco)`}
      </Text>
    </group>
  )
}

function GreenhouseStructure({ tempColor, humColor, showWireframe }: { tempColor: THREE.Color; humColor: THREE.Color; showWireframe: boolean }) {
  const hw = W / 2   // 2.5
  const hl = L / 2   // 5.0

  return (
    <group>
      {/* Floor — 5 m × 10 m */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, L]} />
        <meshStandardMaterial color="#0a1428" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Floor grid overlay — 5 m × 10 m, 1 m cells */}
      <Grid
        position={[0, 0.01, 0]}
        args={[W, L]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#00aaff"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#0044aa"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Main walls (glass) — using real dimensions */}
      {[
        // South wall (Z = +5): 5 m wide × 3 m tall
        { pos: [0, H / 2, hl] as [number, number, number], rot: [0, 0, 0] as [number, number, number], args: [W, H] as [number, number] },
        // North wall (Z = -5): 5 m wide × 3 m tall
        { pos: [0, H / 2, -hl] as [number, number, number], rot: [0, 0, 0] as [number, number, number], args: [W, H] as [number, number] },
        // East wall (X = +2.5): 10 m long × 3 m tall
        { pos: [hw, H / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], args: [L, H] as [number, number] },
        // West wall (X = -2.5): 10 m long × 3 m tall
        { pos: [-hw, H / 2, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], args: [L, H] as [number, number] },
      ].map((wall, i) => (
        <mesh key={i} position={wall.pos} rotation={wall.rot}>
          <planeGeometry args={wall.args} />
          <meshStandardMaterial color="#1a3a6a" transparent opacity={0.25} side={THREE.DoubleSide} metalness={0.1} roughness={0.1} />
        </mesh>
      ))}

      {/* Roof panels — pitched along X, spanning full 10 m length */}
      {[
        { pos: [-hw / 2, H + 0.2, 0] as [number, number, number], rot: [0, 0, -Math.PI / 6] as [number, number, number] },
        { pos: [ hw / 2, H + 0.2, 0] as [number, number, number], rot: [0, 0,  Math.PI / 6] as [number, number, number] },
      ].map((r, i) => (
        <mesh key={i} position={r.pos} rotation={r.rot}>
          <planeGeometry args={[L, 3.0]} />
          <meshStandardMaterial color="#1a3d7a" transparent opacity={0.2} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Vertical structural beams — every 2.5 m along length */}
      {[-hw, 0, hw].map((x) =>
        [-hl, 0, hl].map((z) => (
          <mesh key={`v-${x}-${z}`} position={[x, H / 2, z]}>
            <boxGeometry args={[0.06, H, 0.06]} />
            <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
          </mesh>
        ))
      )}

      {/* Horizontal ridge beams along the length (Z axis) */}
      {[-hl + 0.1, 0, hl - 0.1].map((z) => (
        <mesh key={`h-${z}`} position={[0, H, z]}>
          <boxGeometry args={[W, 0.06, 0.06]} />
          <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Purlins along Z axis at top of each wall */}
      {[-hw, hw].map((x) => (
        <mesh key={`p-${x}`} position={[x, H, 0]}>
          <boxGeometry args={[0.06, 0.06, L]} />
          <meshStandardMaterial color="#00aaff" emissive="#0044aa" emissiveIntensity={0.3} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Ambient temperature haze — fills interior volume */}
      {showWireframe && (
        <mesh position={[0, H / 2, 0]}>
          <boxGeometry args={[W - 0.2, H, L - 0.2]} />
          <meshStandardMaterial color={tempColor} transparent opacity={0.03} wireframe={showWireframe} />
        </mesh>
      )}

      {/* Corner column glows */}
      {[[-hw, -hl], [-hw, hl], [hw, -hl], [hw, hl]].map(([x, z], i) => (
        <pointLight key={i} position={[x, 0.5, z]} color="#0044aa" intensity={0.3} distance={4} />
      ))}

      {/* Roof ridge lights — spread along the 10 m length */}
      {[-3, 0, 3].map((z) => (
        <pointLight key={`rl-${z}`} position={[0, H + 1, z]} color="#00aaff" intensity={0.6} distance={7} />
      ))}
    </group>
  )
}

function HUD({ internal, external }: { internal: any; external: any }) {
  // HUD floats above the greenhouse (Y ≈ 5), centred on the scene
  return (
    <>
      {internal && (
        <>
          <Text position={[-2.4, 5.0, 0]} fontSize={0.15} color="#00aaff" anchorX="left" fontWeight={700}>
            {'◈ CAPTEURS INTERNES'}
          </Text>
          <Text position={[-2.4, 4.7, 0]} fontSize={0.1} color="#e0e8f8" anchorX="left">
            {`Température: ${internal.temperature?.toFixed(1)}°C  |  CO₂: ${internal.co2?.toFixed(0)} ppm`}
          </Text>
          <Text position={[-2.4, 4.5, 0]} fontSize={0.1} color="#8aaccc" anchorX="left">
            {`Humidité: ${internal.humidity?.toFixed(1)}%  |  VPD: ${internal.vpd?.toFixed(2)} kPa`}
          </Text>
        </>
      )}
      {external && (
        <>
          <Text position={[0.2, 5.0, 0]} fontSize={0.15} color="#ffaa00" anchorX="left" fontWeight={700}>
            {'◈ CAPTEURS EXTERNES'}
          </Text>
          <Text position={[0.2, 4.7, 0]} fontSize={0.1} color="#e0e8f8" anchorX="left">
            {`Radiation: ${external.radiation?.toFixed(0)} W/m²  |  Vent: ${external.wind_speed?.toFixed(1)} m/s`}
          </Text>
          <Text position={[0.2, 4.5, 0]} fontSize={0.1} color="#8aaccc" anchorX="left">
            {`Temp: ${external.temperature?.toFixed(1)}°C  |  Hum: ${external.humidity?.toFixed(1)}%`}
          </Text>
        </>
      )}
    </>
  )
}

function Scene({ devices, showWireframe }: { devices: Device[]; showWireframe: boolean }) {
  const { internal, external } = useLatestSensorData(30000)

  const tempColor = internal ? tempToColor(internal.temperature) : new THREE.Color('#00aaff')
  const humColor = internal ? humidToColor(internal.humidity) : new THREE.Color('#00ccff')

  const roofFans = devices.filter((d) => d.location === 'roof')
  const ceilFans = devices.filter((d) => d.location === 'ceiling')

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-5, 6, -5]} intensity={0.4} color="#4488ff" />
      <pointLight position={[0, 5, 0]} intensity={0.8} color="#0066aa" />
      <hemisphereLight args={['#0a1f4a', '#000510', 0.6]} />

      {/* Sparkles scaled to 5 m × 10 m footprint */}
      <Sparkles count={80} scale={[W, 4, L]} size={0.8} speed={0.3} color="#00aaff" opacity={0.3} />

      <GreenhouseStructure tempColor={tempColor} humColor={humColor} showWireframe={showWireframe} />

      {/* 3 gouttières de culture fraisier — 8.5 m chacune, 80 plants, substrat fibre de coco */}
      <GutterStructure />

      {/* Internal sensor nodes — distributed inside the 5 m × 10 m space
          X stays within ±2.0 m, Z spread over the 10 m length */}
      {internal && (
        <>
          {/* North zone */}
          <SensorNode position={[-1.5, 1.2, -3]} value={internal.temperature} unit="°C"  label="Température"   color={tempColor.getStyle()} />
          <SensorNode position={[ 1.5, 1.2, -3]} value={internal.co2}         unit=""    label="CO₂ ppm"        color="#00aaff" />
          {/* Center zone */}
          <SensorNode position={[ 0,   1.2,  0]} value={internal.humidity}    unit="%"   label="Humidité"       color={humColor.getStyle()} />
          {/* South zone */}
          <SensorNode position={[-1.5, 1.2,  3]} value={internal.voc}         unit=""    label="VOC ppb"        color="#cc44ff" />
          <SensorNode position={[ 1.5, 1.2,  3]} value={internal.pressure}    unit=""    label="Pression hPa"   color="#ffaa00" />
        </>
      )}

      {/* Roof fans — 3 fans spread along the 10 m length at the ridge (Y = H + 0.55)
          X = 0 (center of the 5 m width), Z = -3.5 / 0 / +3.5 */}
      {roofFans.map((fan, i) => (
        <Fan
          key={fan.id}
          position={[0, H + 0.55, (i - 1) * 3.5]}
          status={fan.status}
          name={fan.name}
        />
      ))}

      {/* Ceiling fans — 3 fans below the roof, same Z spacing, slightly lower */}
      {ceilFans.map((fan, i) => (
        <Fan
          key={fan.id}
          position={[0, H - 0.2, (i - 1) * 3.5]}
          status={fan.status}
          name={fan.name}
        />
      ))}

      {/* External weather station — placed 1.5 m outside the East wall (X = +2.5) */}
      {external && (
        <group position={[W / 2 + 1.5, 1.5, 0]}>
          <Float speed={1} floatIntensity={0.4}>
            <mesh>
              <boxGeometry args={[0.3, 0.5, 0.15]} />
              <meshStandardMaterial color="#ffaa00" emissive="#aa6600" emissiveIntensity={0.4} metalness={0.7} roughness={0.3} />
            </mesh>
            <Text position={[0, 0.45, 0]} fontSize={0.09} color="#ffaa00" anchorX="center">
              {`☀ ${external.radiation?.toFixed(0)}W/m²`}
            </Text>
            <Text position={[0, 0.56, 0]} fontSize={0.09} color="#00ccff" anchorX="center">
              {`💨 ${external.wind_speed?.toFixed(1)}m/s`}
            </Text>
            <pointLight color="#ffaa00" intensity={0.4} distance={2} />
          </Float>
          <Text position={[0, -0.45, 0]} fontSize={0.09} color="#8aaccc" anchorX="center">
            Station Ext.
          </Text>
        </group>
      )}

      <HUD internal={internal} external={external} />

      {/* Camera positioned to frame the full 5 m × 10 m greenhouse */}
      <OrbitControls
        enablePan enableZoom enableRotate
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 1.5, 0]}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  )
}

export default function Visualization3DPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [showWireframe, setShowWireframe] = useState(false)
  const [loading, setLoading] = useState(true)
  const { internal } = useLatestSensorData(30000)

  useEffect(() => {
    devicesApi.list().then((r) => { setDevices(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const fanOn = devices.filter((d) => d.status === 'ON').length
  const fanErr = devices.filter((d) => d.status === 'Erreur').length

  return (
    <Box sx={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: '#e0e8f8' }}>Jumeau Numérique 3D — Serre Fraisier</Typography>
          <Typography variant="body2" sx={{ color: '#8aaccc', mt: 0.3 }}>3 gouttières × 8.5 m · 80 plants · Fibre de coco · 6 ventilateurs</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[
            { label: `${fanOn} ventilateurs ON`, color: '#00ff88' },
            { label: fanErr > 0 ? `${fanErr} erreurs` : 'Aucune erreur', color: fanErr > 0 ? '#ff3366' : '#00ff88' },
            { label: internal ? `${internal.temperature?.toFixed(1)}°C` : '...', color: '#ff6644' },
          ].map((chip) => (
            <Chip key={chip.label} label={chip.label} size="small" sx={{ bgcolor: `${chip.color}15`, color: chip.color, border: `1px solid ${chip.color}33`, fontFamily: '"JetBrains Mono", monospace', fontSize: '0.7rem' }} />
          ))}
          <FormControlLabel
            control={<Switch size="small" checked={showWireframe} onChange={(e) => setShowWireframe(e.target.checked)} />}
            label={<Typography variant="caption" sx={{ color: '#8aaccc' }}>Wireframe</Typography>}
          />
        </Box>
      </Box>

      {/* 3D Canvas */}
      <Paper sx={{ flex: 1, overflow: 'hidden', border: '1px solid rgba(0,170,255,0.2)', position: 'relative',
        '&::before': { content: '""', position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(0,100,200,0.1) 0%, transparent 60%)', zIndex: 1, pointerEvents: 'none' } }}>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: '#00aaff' }} />
            <Typography sx={{ color: '#8aaccc' }}>Chargement de la scène 3D...</Typography>
          </Box>
        ) : (
          <Canvas
            camera={{ position: [8, 6, 14], fov: 55, near: 0.1, far: 100 }}
            gl={{ antialias: true }}
            style={{ background: 'radial-gradient(ellipse at center, #050f22 0%, #020508 100%)' }}
          >
            <Suspense fallback={
              <mesh>
                <boxGeometry args={[0.01, 0.01, 0.01]} />
                <meshBasicMaterial color="#000000" />
              </mesh>
            }>
              <Scene devices={devices} showWireframe={showWireframe} />
            </Suspense>
          </Canvas>
        )}

        {/* Legend overlay */}
        <Box sx={{ position: 'absolute', bottom: 16, left: 16, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Légende Température
          </Typography>
          {[
            { label: '< 15°C', color: '#0066ff' },
            { label: '15-22°C', color: '#00aaff' },
            { label: '22-28°C', color: '#00ff88' },
            { label: '28-33°C', color: '#ffaa00' },
            { label: '> 33°C', color: '#ff3344' },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: item.color, boxShadow: `0 0 6px ${item.color}88` }} />
              <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Controls hint */}
        <Box sx={{ position: 'absolute', bottom: 16, right: 16, zIndex: 2 }}>
          <Typography variant="caption" sx={{ color: '#8aaccc', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.65rem' }}>
            🖱️ Clic + glisser: Rotation | Scroll: Zoom | Clic droit: Déplacer
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
