import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Text, Html } from "@react-three/drei";
import type { BeakerState, ReagentId } from "@/lib/chem-engine";
import { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";

// ===== World layout =====
const TABLE_TOP_Y = -0.55; // top surface of the lab table

// ===== Reaction detection =====
type ReactionKind = "none" | "dissolve" | "fizz" | "neutralize" | "indicator" | "splash";

function detectReaction(prev: BeakerState, next: BeakerState): ReactionKind {
  if (next.addOrder.length === prev.addOrder.length) return "none";
  const added = next.addOrder[next.addOrder.length - 1];
  const has = (id: ReagentId) => (next.contents[id] ?? 0) > 0;
  // titrasi PP + basa berlebih → indikator (perubahan warna dramatis)
  if (added === "naoh" && has("hcl") && has("pp")) return "indicator";
  // asam + basa → netralisasi (panas, gelembung halus)
  if ((added === "naoh" && has("hcl")) || (added === "hcl" && has("naoh"))) return "neutralize";
  // padatan (NaCl) masuk air → melarut, sedikit gelembung
  if (added === "nacl" && has("water")) return "dissolve";
  // asam kuat + air → percikan/pengenceran (bui)
  if (added === "hcl" && has("water")) return "fizz";
  return "splash";
}

// ===== Table =====
function LabTable() {
  return (
    <>
      <mesh position={[0, -0.6, 0]} receiveShadow>
        <boxGeometry args={[6, 0.1, 3]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* grid lines on table */}
      <gridHelper args={[6, 12, "#334155", "#1e293b"]} position={[0, -0.549, 0]} />
    </>
  );
}

// ===== Bubbles (rising) =====
interface Bubble {
  x: number; z: number; y: number; speed: number; size: number;
}
function Bubbles({ intensity, maxY }: { intensity: number; maxY: number }) {
  const bubblesRef = useRef<Bubble[]>([]);
  const groupRef = useRef<THREE.Group>(null);
  const spawnAcc = useRef(0);
  const CAP = 220;

  useFrame((_, delta) => {
    spawnAcc.current += delta * intensity * 120;
    while (spawnAcc.current > 1 && bubblesRef.current.length < CAP) {
      spawnAcc.current -= 1;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.6;
      bubblesRef.current.push({
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r,
        y: -0.7 + Math.random() * 0.1,
        speed: 0.8 + Math.random() * 1.8,
        size: 0.05 + Math.random() * 0.12,
      });
    }
    bubblesRef.current = bubblesRef.current.filter((b) => {
      b.y += b.speed * delta;
      b.x += Math.sin(b.y * 6) * delta * 0.05;
      return b.y < maxY - 0.75;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const b = bubblesRef.current[i];
      if (b) {
        child.position.set(b.x, b.y, b.z);
        child.scale.setScalar(b.size * 15);
        child.visible = true;
      } else child.visible = false;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: CAP }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.75} transmission={0.9} roughness={0.05} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Steam / smoke wisps (rising above beaker) =====
function Steam({ intensity, y, color = "#f8fafc" }: { intensity: number; y: number; color?: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef<{ x: number; y: number; z: number; life: number; scale: number; vx: number; vz: number }[]>([]);
  const CAP = 80;
  const spawnAcc = useRef(0);

  useFrame((_, delta) => {
    spawnAcc.current += delta * intensity * 40;
    while (spawnAcc.current > 1 && particles.current.length < CAP) {
      spawnAcc.current -= 1;
      const a = Math.random() * Math.PI * 2;
      particles.current.push({
        x: (Math.random() - 0.5) * 0.6,
        y: 0,
        z: (Math.random() - 0.5) * 0.6,
        vx: Math.cos(a) * 0.15,
        vz: Math.sin(a) * 0.15,
        life: 1,
        scale: 0.25 + Math.random() * 0.4,
      });
    }
    particles.current = particles.current.filter((p) => {
      p.y += delta * (1.2 + intensity * 0.8);
      p.x += p.vx * delta;
      p.z += p.vz * delta;
      p.life -= delta * 0.4;
      p.scale += delta * 0.6;
      return p.life > 0;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const p = particles.current[i];
      const m = child as THREE.Mesh;
      if (p) {
        m.position.set(p.x, y + p.y, p.z);
        m.scale.setScalar(p.scale);
        const mat = m.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, p.life) * 0.65;
        m.visible = true;
      } else m.visible = false;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: CAP }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.22, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Sparks (bright fast-fading points for explosive reactions) =====
function Sparks({ trigger, y, color }: { trigger: number; y: number; color: THREE.Color }) {
  const groupRef = useRef<THREE.Group>(null);
  const sparks = useRef<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const el = Math.random() * Math.PI * 0.5;
      const sp = 1.5 + Math.random() * 2.5;
      sparks.current.push({
        x: 0, y: 0, z: 0,
        vx: Math.cos(a) * Math.cos(el) * sp,
        vy: Math.sin(el) * sp + 1,
        vz: Math.sin(a) * Math.cos(el) * sp,
        life: 0.6 + Math.random() * 0.4,
      });
    }
  }, [trigger]);

  useFrame((_, delta) => {
    sparks.current = sparks.current.filter((s) => {
      s.vy -= delta * 4;
      s.x += s.vx * delta;
      s.y += s.vy * delta;
      s.z += s.vz * delta;
      s.life -= delta * 1.5;
      return s.life > 0;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const s = sparks.current[i];
      const m = child as THREE.Mesh;
      if (s) {
        m.position.set(s.x, y + s.y, s.z);
        const scl = Math.max(0.1, s.life) * 0.8;
        m.scale.setScalar(scl);
        (m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, s.life);
        m.visible = true;
      } else m.visible = false;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: 80 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Shockwave (expanding ring for explosive reactions) =====
function Shockwave({ trigger, y, color }: { trigger: number; y: number; color: THREE.Color }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const start = useRef(0);
  const active = useRef(false);
  useEffect(() => {
    if (trigger > 0) { start.current = performance.now(); active.current = true; }
  }, [trigger]);
  useFrame(() => {
    if (!meshRef.current || !active.current) return;
    const t = (performance.now() - start.current) / 900;
    if (t > 1) { meshRef.current.visible = false; active.current = false; return; }
    meshRef.current.visible = true;
    const s = 0.3 + t * 4;
    meshRef.current.scale.set(s, s, s);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9;
  });
  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.5, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ===== Foam overflow (frothy bubbles spilling over beaker rim) =====
function FoamOverflow({ intensity, y, color }: { intensity: number; y: number; color: THREE.Color }) {
  const groupRef = useRef<THREE.Group>(null);
  const foam = useRef<{ ang: number; r: number; y: number; vy: number; life: number; size: number }[]>([]);
  const spawnAcc = useRef(0);
  const CAP = 120;
  useFrame((_, delta) => {
    spawnAcc.current += delta * intensity * 60;
    while (spawnAcc.current > 1 && foam.current.length < CAP) {
      spawnAcc.current -= 1;
      const ang = Math.random() * Math.PI * 2;
      foam.current.push({
        ang, r: 0.72 + Math.random() * 0.05,
        y: 0, vy: -0.4 - Math.random() * 0.6,
        life: 1, size: 0.08 + Math.random() * 0.1,
      });
    }
    foam.current = foam.current.filter((f) => {
      f.vy -= delta * 1.5;
      f.y += f.vy * delta;
      f.r += delta * 0.15;
      f.life -= delta * 0.6;
      return f.life > 0 && f.y > -1.5;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const f = foam.current[i];
      const m = child as THREE.Mesh;
      if (f) {
        m.position.set(Math.cos(f.ang) * f.r, y + f.y, Math.sin(f.ang) * f.r);
        m.scale.setScalar(f.size);
        m.visible = true;
      } else m.visible = false;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: CAP }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshPhysicalMaterial color={color} transparent opacity={0.85} roughness={0.3} transmission={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Splash ring on add =====
function SplashRing({ trigger, y, color }: { trigger: number; y: number; color: THREE.Color }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const start = useRef(0);
  const active = useRef(false);

  useEffect(() => {
    if (trigger > 0) {
      start.current = performance.now();
      active.current = true;
    }
  }, [trigger]);

  useFrame(() => {
    if (!meshRef.current || !active.current) return;
    const t = (performance.now() - start.current) / 700;
    if (t > 1) { meshRef.current.visible = false; active.current = false; return; }
    meshRef.current.visible = true;
    const s = 0.3 + t * 1.8;
    meshRef.current.scale.set(s, s, s);
    meshRef.current.position.y = y + t * 0.15;
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.7;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.2, 0.35, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

// ===== Splash droplets =====
function Droplets({ trigger, y, color }: { trigger: number; y: number; color: THREE.Color }) {
  const groupRef = useRef<THREE.Group>(null);
  const drops = useRef<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number }[]>([]);

  useEffect(() => {
    if (trigger <= 0) return;
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 0.6 + Math.random() * 0.8;
      drops.current.push({
        x: 0, y: 0, z: 0,
        vx: Math.cos(a) * speed * 0.4,
        vy: 1.2 + Math.random() * 0.8,
        vz: Math.sin(a) * speed * 0.4,
        life: 1,
      });
    }
  }, [trigger]);

  useFrame((_, delta) => {
    drops.current = drops.current.filter((d) => {
      d.vy -= delta * 5;
      d.x += d.vx * delta;
      d.y += d.vy * delta;
      d.z += d.vz * delta;
      d.life -= delta * 1.2;
      return d.life > 0;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const d = drops.current[i];
      const m = child as THREE.Mesh;
      if (d) {
        m.position.set(d.x, y + d.y, d.z);
        m.visible = true;
      } else m.visible = false;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshPhysicalMaterial color={color} transmission={0.6} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Liquid surface w/ waves =====
function LiquidSurface({ y, radius, color, stirring }: { y: number; radius: number; color: THREE.Color; stirring: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  useFrame((state) => {
    if (!geoRef.current) return;
    const t = state.clock.elapsedTime;
    const pos = geoRef.current.attributes.position;
    const amp = 0.01 + stirring * 0.05;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const yv = pos.getY(i);
      pos.setZ(i, Math.sin(x * 8 + t * 3) * amp + Math.cos(yv * 8 + t * 2.5) * amp);
    }
    pos.needsUpdate = true;
    if (meshRef.current && stirring > 0.01) meshRef.current.rotation.z = t * stirring * 3;
  });
  return (
    <mesh ref={meshRef} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry ref={geoRef} args={[radius * 2, radius * 2, 24, 24]} />
      <meshPhysicalMaterial
        color={color} transparent opacity={0.95} roughness={0.15}
        metalness={0.1} transmission={0.3} emissive={color} emissiveIntensity={0.2}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ===== Beaker =====
function BeakerMesh({
  state, bubbleIntensity, steamIntensity, splashTrigger, splashColor, glowIntensity, stirIntensity, flashColor, sparkTrigger, sparkColor, shockTrigger, foamIntensity,
}: {
  state: BeakerState;
  bubbleIntensity: number;
  steamIntensity: number;
  splashTrigger: number;
  splashColor: THREE.Color;
  glowIntensity: number;
  stirIntensity: number;
  flashColor: THREE.Color | null;
  sparkTrigger: number;
  sparkColor: THREE.Color;
  shockTrigger: number;
  foamIntensity: number;
}) {
  const targetHeight = Math.min(1.4, (state.totalVolumeMl / 100) * 1.4);
  const [fillHeight, setFillHeight] = useState(targetHeight);
  const targetColor = useMemo(() => new THREE.Color(state.color || "#38bdf8"), [state.color]);
  const currentColor = useRef(new THREE.Color(state.color || "#38bdf8"));
  const [displayColor, setDisplayColor] = useState(currentColor.current.clone());
  const glowRef = useRef<THREE.PointLight>(null);
  const flashRef = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    setFillHeight((h) => h + (targetHeight - h) * Math.min(1, delta * 4));
    currentColor.current.lerp(targetColor, Math.min(1, delta * 3));
    setDisplayColor(currentColor.current.clone());
    if (glowRef.current) glowRef.current.intensity = glowIntensity * 3;
    if (flashRef.current) {
      const target = flashColor ? 4 : 0;
      flashRef.current.intensity += (target - flashRef.current.intensity) * Math.min(1, delta * 6);
      if (flashColor) flashRef.current.color.copy(flashColor);
    }
  });

  // Beaker group so its base sits on TABLE_TOP_Y (base half-thickness = 0.02)
  const groupY = TABLE_TOP_Y + 0.82; // base bottom at -0.82 in local

  return (
    <group position={[0, groupY, 0]}>
      <pointLight ref={glowRef} position={[0, 0, 0]} color={displayColor} intensity={0} distance={3} />
      <pointLight ref={flashRef} position={[0, 0.5, 0]} color="#ffffff" intensity={0} distance={5} />
      {/* glass cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.6, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#e0f2fe" transparent opacity={0.2} transmission={0.95}
          thickness={0.4} roughness={0.02} metalness={0} side={THREE.DoubleSide} ior={1.5}
        />
      </mesh>
      {/* liquid body */}
      {fillHeight > 0.01 && (
        <>
          <mesh position={[0, fillHeight / 2 - 0.75, 0]}>
            <cylinderGeometry args={[0.72, 0.72, fillHeight, 48]} />
            <meshPhysicalMaterial
              color={displayColor} transparent opacity={0.8} roughness={0.2}
              metalness={0.05} transmission={0.2}
              emissive={displayColor} emissiveIntensity={0.15 + glowIntensity * 0.4}
            />
          </mesh>
          <LiquidSurface y={fillHeight - 0.75} radius={0.71} color={displayColor} stirring={stirIntensity} />
          <Bubbles intensity={bubbleIntensity} maxY={fillHeight} />
          <SplashRing trigger={splashTrigger} y={fillHeight - 0.72} color={splashColor} />
          <Droplets trigger={splashTrigger} y={fillHeight - 0.72} color={splashColor} />
          <Sparks trigger={sparkTrigger} y={fillHeight - 0.7} color={sparkColor} />
          <Shockwave trigger={shockTrigger} y={fillHeight - 0.7} color={sparkColor} />
          <FoamOverflow intensity={foamIntensity} y={fillHeight - 0.75} color={displayColor} />
        </>
      )}
      {/* steam ABOVE liquid */}
      <Steam intensity={steamIntensity} y={fillHeight - 0.6} />
      {steamIntensity > 0.4 && <Steam intensity={steamIntensity * 0.7} y={fillHeight - 0.4} color="#e2e8f0" />}
      {/* solid base */}
      {/* solid base */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.76, 0.76, 0.04, 48]} />
        <meshStandardMaterial color="#cbd5e1" transparent opacity={0.5} />
      </mesh>
      {/* graduation marks */}
      {[0.25, 0.5, 0.75, 1.0, 1.25].map((h) => (
        <mesh key={h} position={[0.76, h - 0.75, 0]}>
          <boxGeometry args={[0.015, 0.005, 0.18]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
      ))}
    </group>
  );
}

// ===== Reagent bottle =====
function ReagentBottle({
  x, z = -0.9, color, label, onClick, highlight, pouring,
}: {
  x: number; z?: number; color: string; label: string;
  onClick?: () => void; highlight: boolean; pouring: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const pourStart = useRef(0);
  useEffect(() => { if (pouring) pourStart.current = performance.now(); }, [pouring]);

  // Bottle height = 0.85; sit its base on table top
  const baseY = TABLE_TOP_Y + 0.425; // center at TABLE_TOP + half height

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const targetY = hover ? baseY + 0.15 : baseY;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    if (highlight) groupRef.current.position.y += Math.sin(t * 5) * 0.03;
    // Pour animation: tilt toward center
    const elapsed = (performance.now() - pourStart.current) / 800;
    if (pouring && elapsed < 1) {
      const tilt = Math.sin(elapsed * Math.PI) * 0.7;
      groupRef.current.rotation.z = x > 0 ? tilt : -tilt;
    } else {
      groupRef.current.rotation.z += (0 - groupRef.current.rotation.z) * 0.1;
    }
  });

  return (
    <group
      ref={groupRef}
      position={[x, baseY, z]}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = "default"; }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {/* body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.3, 0.7, 32]} />
        <meshPhysicalMaterial
          color={color} transparent opacity={0.9} transmission={0.5}
          roughness={0.1} thickness={0.3} ior={1.4}
        />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.12, 24]} />
        <meshPhysicalMaterial color={color} transparent opacity={0.9} transmission={0.5} roughness={0.1} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.08, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* label plate */}
      <mesh position={[0, 0, 0.281]}>
        <planeGeometry args={[0.4, 0.22]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <Text position={[0, 0, 0.283]} fontSize={0.11} color="#0f172a" anchorX="center" anchorY="middle" fontWeight="bold">
        {label}
      </Text>
      {(hover || highlight) && (
        <mesh position={[0, -0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshBasicMaterial color={highlight ? "#22d3ee" : "#38bdf8"} transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  );
}

// ===== Pour stream (falling droplets from a bottle position toward the beaker) =====
function PourStream({ trigger, from, color }: { trigger: number; from: [number, number, number]; color: THREE.Color }) {
  const groupRef = useRef<THREE.Group>(null);
  const drops = useRef<{ t: number; ox: number; oz: number }[]>([]);
  const spawnUntil = useRef(0);

  useEffect(() => {
    if (trigger > 0) spawnUntil.current = performance.now() + 700;
  }, [trigger]);

  useFrame((_, delta) => {
    if (performance.now() < spawnUntil.current && drops.current.length < 40) {
      for (let i = 0; i < 2; i++) {
        drops.current.push({
          t: 0,
          ox: (Math.random() - 0.5) * 0.08,
          oz: (Math.random() - 0.5) * 0.08,
        });
      }
    }
    drops.current = drops.current.filter((d) => {
      d.t += delta * 2;
      return d.t < 1;
    });
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const d = drops.current[i];
      const m = child as THREE.Mesh;
      if (d) {
        const x = from[0] * (1 - d.t) + 0 * d.t + d.ox;
        const y = from[1] + 0.2 - d.t * d.t * 1.5;
        const z = from[2] * (1 - d.t) + 0 * d.t + d.oz;
        m.position.set(x, y, z);
        m.visible = true;
      } else m.visible = false;
    });
  });
  return (
    <group ref={groupRef}>
      {Array.from({ length: 40 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[0.035, 6, 6]} />
          <meshPhysicalMaterial color={color} transmission={0.6} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ===== Main scene =====
export function LabScene({
  state, onReagentClick, activeReagent,
}: {
  state: BeakerState;
  onReagentClick?: (id: string) => void;
  activeReagent?: string | null;
}) {
  // Track additions and reaction kind
  const prevState = useRef<BeakerState>(state);
  const [reaction, setReaction] = useState<ReactionKind>("none");
  const [reactionAt, setReactionAt] = useState(0);
  const [lastAdded, setLastAdded] = useState<ReagentId | null>(null);
  const [pourTrigger, setPourTrigger] = useState(0);
  const [splashTrigger, setSplashTrigger] = useState(0);

  useEffect(() => {
    const kind = detectReaction(prevState.current, state);
    if (kind !== "none") {
      setReaction(kind);
      setReactionAt(performance.now());
      setLastAdded(state.addOrder[state.addOrder.length - 1] as ReagentId);
      setPourTrigger((n) => n + 1);
      // Delay splash to when droplets land
      setTimeout(() => setSplashTrigger((n) => n + 1), 500);
    }
    prevState.current = state;
  }, [state]);

  // Live intensities (decay over time)
  const [bubbleIntensity, setBubbleIntensity] = useState(0);
  const [steamIntensity, setSteamIntensity] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [stirIntensity, setStirIntensity] = useState(0);
  const [flashColor, setFlashColor] = useState<THREE.Color | null>(null);

  // React to reaction
  useEffect(() => {
    if (reaction === "none") return;
    // Configure per-reaction effect profile
    const profile: Record<Exclude<ReactionKind, "none">, { bubbles: number; steam: number; glow: number; duration: number; flash: string | null }> = {
      dissolve:   { bubbles: 0.4, steam: 0.0, glow: 0.5, duration: 2500, flash: null },
      fizz:       { bubbles: 1.0, steam: 0.3, glow: 0.7, duration: 3000, flash: null },
      neutralize: { bubbles: 0.9, steam: 0.9, glow: 0.9, duration: 3500, flash: "#fef08a" },
      indicator:  { bubbles: 0.5, steam: 0.2, glow: 1.0, duration: 3000, flash: "#f472b6" },
      splash:     { bubbles: 0.3, steam: 0.0, glow: 0.4, duration: 1500, flash: null },
    };
    const p = profile[reaction];
    setBubbleIntensity(p.bubbles);
    setSteamIntensity(p.steam);
    setGlowIntensity(p.glow);
    if (p.flash) setFlashColor(new THREE.Color(p.flash));
    const start = performance.now();
    let raf: number;
    const tick = () => {
      const elapsed = (performance.now() - start) / p.duration;
      const k = Math.max(0, 1 - elapsed);
      setBubbleIntensity(p.bubbles * k);
      setSteamIntensity(p.steam * k);
      setGlowIntensity(p.glow * k);
      if (k > 0) raf = requestAnimationFrame(tick);
      else setFlashColor(null);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [reaction, reactionAt]);

  // Stir intensity
  const lastStirred = useRef(state.stirred);
  useEffect(() => {
    if (state.stirred && !lastStirred.current) {
      setStirIntensity(1);
      lastStirred.current = true;
      const start = performance.now();
      let raf: number;
      const tick = () => {
        const e = (performance.now() - start) / 2500;
        const v = Math.max(0, 1 - e);
        setStirIntensity(v);
        // Extra bubbles while stirring
        setBubbleIntensity((b) => Math.max(b, v * 0.5));
        if (v > 0) raf = requestAnimationFrame(tick);
      };
      tick();
      return () => cancelAnimationFrame(raf);
    }
    if (!state.stirred) lastStirred.current = false;
  }, [state.stirred]);

  const splashColor = useMemo(
    () => new THREE.Color(state.color || "#38bdf8"),
    [state.color],
  );

  // Bottle positions: keep 5 bottles arranged left-to-right BEHIND the beaker
  const bottles: { id: ReagentId; x: number; color: string; label: string }[] = [
    { id: "water", x: -2.2, color: "#7dd3fc", label: "H₂O" },
    { id: "hcl",   x: -1.2, color: "#fde68a", label: "HCl" },
    { id: "nacl",  x:  0.0, color: "#f1f5f9", label: "NaCl" },
    { id: "naoh",  x:  1.2, color: "#bfdbfe", label: "NaOH" },
    { id: "pp",    x:  2.2, color: "#f9a8d4", label: "PP" },
  ];
  const pouringBottle = lastAdded;
  const pourFrom = useMemo(() => {
    const b = bottles.find((x) => x.id === pouringBottle);
    return b ? ([b.x, TABLE_TOP_Y + 0.6, -0.9] as [number, number, number]) : ([0, 1, 0] as [number, number, number]);
  }, [pouringBottle]);
  const pourColor = useMemo(() => {
    const b = bottles.find((x) => x.id === pouringBottle);
    return new THREE.Color(b?.color ?? "#7dd3fc");
  }, [pouringBottle]);

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [3, 2, 4], fov: 45 }} className="!bg-transparent">
      <color attach="background" args={["#0b1220"]} />
      <fog attach="fog" args={["#0b1220", 8, 16]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[5, 6, 3]} intensity={1.1} castShadow />
      <pointLight position={[-3, 3, -2]} intensity={0.7} color="#22d3ee" />
      <pointLight position={[3, 3, 2]} intensity={0.5} color="#a78bfa" />
      <Environment preset="city" />
      <LabTable />
      <BeakerMesh
        state={state}
        bubbleIntensity={bubbleIntensity}
        steamIntensity={steamIntensity}
        splashTrigger={splashTrigger}
        splashColor={splashColor}
        glowIntensity={glowIntensity}
        stirIntensity={stirIntensity}
        flashColor={flashColor}
      />
      {bottles.map((b) => (
        <ReagentBottle
          key={b.id}
          x={b.x}
          color={b.color}
          label={b.label}
          onClick={() => onReagentClick?.(b.id)}
          highlight={activeReagent === b.id}
          pouring={pouringBottle === b.id && pourTrigger > 0 && performance.now() - reactionAt < 900}
        />
      ))}
      <PourStream trigger={pourTrigger} from={pourFrom} color={pourColor} />

      {/* Floating reaction badge */}
      {reaction !== "none" && performance.now() - reactionAt < 2500 && (
        <Html position={[0, 1.6, 0]} center distanceFactor={6} zIndexRange={[10, 0]}>
          <div className="pointer-events-none rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs text-white shadow-lg backdrop-blur animate-fade-in">
            {reaction === "dissolve" && "💧 Melarut…"}
            {reaction === "fizz" && "🫧 Pengenceran asam — timbul gelembung"}
            {reaction === "neutralize" && "🔥 Reaksi netralisasi (eksotermik)"}
            {reaction === "indicator" && "🌸 Indikator PP → merah muda"}
            {reaction === "splash" && "💦 Ditambahkan"}
          </div>
        </Html>
      )}

      <OrbitControls enablePan={false} minDistance={3} maxDistance={8} maxPolarAngle={Math.PI / 2.1} target={[0, 0, 0]} />
    </Canvas>
  );
}
