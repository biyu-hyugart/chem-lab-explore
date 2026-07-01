import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Text } from "@react-three/drei";
import type { BeakerState } from "@/lib/chem-engine";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

function LabTable() {
  return (
    <mesh position={[0, -0.6, 0]} receiveShadow>
      <boxGeometry args={[6, 0.1, 3]} />
      <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

interface Bubble {
  id: number;
  x: number;
  z: number;
  y: number;
  speed: number;
  size: number;
}

function Bubbles({ active, count, maxY }: { active: boolean; count: number; maxY: number }) {
  const bubblesRef = useRef<Bubble[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const nextId = useRef(0);

  useFrame((_, delta) => {
    if (active && bubblesRef.current.length < count) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.5;
      bubblesRef.current.push({
        id: nextId.current++,
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        y: -0.7,
        speed: 0.4 + Math.random() * 0.6,
        size: 0.03 + Math.random() * 0.05,
      });
    }
    bubblesRef.current = bubblesRef.current.filter((b) => {
      b.y += b.speed * delta;
      return b.y < maxY - 0.75;
    });
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const b = bubblesRef.current[i];
        if (b) {
          child.position.set(b.x, b.y, b.z);
          child.scale.setScalar(b.size * 20);
          child.visible = true;
        } else {
          child.visible = false;
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            transmission={0.8}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

function LiquidSurface({ y, radius, color, stirring }: { y: number; radius: number; color: THREE.Color; stirring: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);

  useFrame((state) => {
    if (!geoRef.current) return;
    const t = state.clock.elapsedTime;
    const pos = geoRef.current.attributes.position;
    const amp = 0.008 + stirring * 0.04;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const yv = pos.getY(i);
      const wave = Math.sin(x * 8 + t * 3) * amp + Math.cos(yv * 8 + t * 2.5) * amp;
      pos.setZ(i, wave);
    }
    pos.needsUpdate = true;
    if (meshRef.current && stirring > 0.01) {
      meshRef.current.rotation.z = t * stirring * 3;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry ref={geoRef} args={[radius * 2, radius * 2, 24, 24]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.95}
        roughness={0.15}
        metalness={0.1}
        transmission={0.3}
        emissive={color}
        emissiveIntensity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function BeakerMesh({ state, activityPulse, stirIntensity }: { state: BeakerState; activityPulse: number; stirIntensity: number }) {
  const targetHeight = Math.min(1.4, (state.totalVolumeMl / 100) * 1.4);
  const [fillHeight, setFillHeight] = useState(targetHeight);
  const targetColor = useMemo(() => new THREE.Color(state.color || "#38bdf8"), [state.color]);
  const currentColor = useRef(new THREE.Color(state.color || "#38bdf8"));
  const [displayColor, setDisplayColor] = useState(currentColor.current.clone());
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    // Smoothly interpolate liquid height
    setFillHeight((h) => h + (targetHeight - h) * Math.min(1, delta * 4));
    // Smoothly interpolate color
    currentColor.current.lerp(targetColor, Math.min(1, delta * 3));
    setDisplayColor(currentColor.current.clone());
    // Pulse glow on activity
    if (glowRef.current) {
      glowRef.current.intensity = activityPulse * 2.5;
    }
  });

  return (
    <group position={[0, -0.55, 0]}>
      <pointLight ref={glowRef} position={[0, 0, 0]} color={displayColor} intensity={0} distance={3} />
      {/* glass cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.6, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.15}
          transmission={0.95}
          thickness={0.4}
          roughness={0.02}
          metalness={0}
          side={THREE.DoubleSide}
          ior={1.5}
        />
      </mesh>
      {/* liquid body */}
      {fillHeight > 0.01 && (
        <>
          <mesh position={[0, fillHeight / 2 - 0.75, 0]}>
            <cylinderGeometry args={[0.72, 0.72, fillHeight, 48]} />
            <meshPhysicalMaterial
              color={displayColor}
              transparent
              opacity={0.75}
              roughness={0.2}
              metalness={0.05}
              transmission={0.2}
              emissive={displayColor}
              emissiveIntensity={0.1 + activityPulse * 0.3}
            />
          </mesh>
          <LiquidSurface
            y={fillHeight - 0.75}
            radius={0.71}
            color={displayColor}
            stirring={stirIntensity}
          />
          <Bubbles active={activityPulse > 0.1} count={Math.floor(activityPulse * 20)} maxY={fillHeight} />
        </>
      )}
      {/* base */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.04, 48]} />
        <meshStandardMaterial color="#f1f5f9" transparent opacity={0.35} />
      </mesh>
      {/* graduation marks */}
      {[0.25, 0.5, 0.75, 1.0, 1.25].map((h) => (
        <mesh key={h} position={[0.76, h - 0.75, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.02, 0.005, 0.15]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}

function ReagentBottle({ x, color, label, onClick, highlight }: { x: number; color: string; label: string; onClick?: () => void; highlight: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const targetY = hover ? -0.25 : -0.35;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    if (highlight) {
      groupRef.current.position.y += Math.sin(t * 4) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, -0.35, -0.9]}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.7, 32]} />
        <meshPhysicalMaterial
          color={color}
          transparent
          opacity={0.85}
          transmission={0.4}
          roughness={0.1}
          thickness={0.3}
        />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.15, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <Text
        position={[0, -0.05, 0.29]}
        fontSize={0.11}
        color="#0f172a"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>
      {(hover || highlight) && (
        <mesh position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.3, 0.4, 32]} />
          <meshBasicMaterial color={highlight ? "#22d3ee" : "#38bdf8"} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

export function LabScene({ state, onReagentClick, activeReagent }: { state: BeakerState; onReagentClick?: (id: string) => void; activeReagent?: string | null }) {
  // Detect changes to trigger pulse
  const [activityPulse, setActivityPulse] = useState(0);
  const [stirIntensity, setStirIntensity] = useState(0);
  const lastOrderLen = useRef(state.addOrder.length);
  const lastStirred = useRef(state.stirred);

  useEffect(() => {
    if (state.addOrder.length > lastOrderLen.current) {
      setActivityPulse(1);
      lastOrderLen.current = state.addOrder.length;
      const timer = setTimeout(() => setActivityPulse(0), 1800);
      return () => clearTimeout(timer);
    }
  }, [state.addOrder.length]);

  useEffect(() => {
    if (state.stirred && !lastStirred.current) {
      setStirIntensity(1);
      lastStirred.current = true;
      const timer = setTimeout(() => setStirIntensity(0), 2500);
      return () => clearTimeout(timer);
    }
    if (!state.stirred) lastStirred.current = false;
  }, [state.stirred]);

  // Decay pulse
  const [renderPulse, setRenderPulse] = useState(0);
  useEffect(() => {
    if (activityPulse === 0) return;
    let raf: number;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 1800;
      const v = Math.max(0, 1 - elapsed);
      setRenderPulse(v);
      if (v > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [activityPulse]);

  const [renderStir, setRenderStir] = useState(0);
  useEffect(() => {
    if (stirIntensity === 0) return;
    let raf: number;
    const start = performance.now();
    const tick = () => {
      const elapsed = (performance.now() - start) / 2500;
      const v = Math.max(0, 1 - elapsed);
      setRenderStir(v);
      if (v > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [stirIntensity]);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.5, 1.8, 3.5], fov: 45 }}
      className="!bg-transparent"
    >
      <color attach="background" args={["#0f172a"]} />
      <fog attach="fog" args={["#0f172a", 8, 15]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 3]} intensity={1.1} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color="#22d3ee" />
      <Environment preset="city" />
      <LabTable />
      <BeakerMesh state={state} activityPulse={renderPulse} stirIntensity={renderStir} />
      <ReagentBottle x={-2} color="#7dd3fc" label="H2O" onClick={() => onReagentClick?.("water")} highlight={activeReagent === "water"} />
      <ReagentBottle x={-1.3} color="#fef3c7" label="HCl" onClick={() => onReagentClick?.("hcl")} highlight={activeReagent === "hcl"} />
      <ReagentBottle x={-0.6} color="#e2e8f0" label="NaCl" onClick={() => onReagentClick?.("nacl")} highlight={activeReagent === "nacl"} />
      <ReagentBottle x={1.3} color="#dbeafe" label="NaOH" onClick={() => onReagentClick?.("naoh")} highlight={activeReagent === "naoh"} />
      <ReagentBottle x={2} color="#f9a8d4" label="PP" onClick={() => onReagentClick?.("pp")} highlight={activeReagent === "pp"} />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={7} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
