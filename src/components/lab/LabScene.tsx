import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { BeakerState } from "@/lib/chem-engine";
import { useMemo } from "react";
import * as THREE from "three";

function LabTable() {
  return (
    <mesh position={[0, -0.6, 0]} receiveShadow>
      <boxGeometry args={[6, 0.1, 3]} />
      <meshStandardMaterial color="#1e293b" metalness={0.2} roughness={0.6} />
    </mesh>
  );
}

function BeakerMesh({ state }: { state: BeakerState }) {
  const fillHeight = Math.min(1.4, (state.totalVolumeMl / 100) * 1.4);
  const liquidColor = useMemo(() => new THREE.Color(state.color || "#38bdf8"), [state.color]);

  return (
    <group position={[0, -0.55, 0]}>
      {/* glass cylinder */}
      <mesh castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.6, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#e0f2fe"
          transparent
          opacity={0.18}
          transmission={0.9}
          thickness={0.4}
          roughness={0.05}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* liquid */}
      {fillHeight > 0.01 && (
        <mesh position={[0, fillHeight / 2 - 0.75, 0]}>
          <cylinderGeometry args={[0.72, 0.72, fillHeight, 48]} />
          <meshStandardMaterial
            color={liquidColor}
            transparent
            opacity={0.85}
            roughness={0.2}
            emissive={liquidColor}
            emissiveIntensity={0.08}
          />
        </mesh>
      )}
      {/* base */}
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.75, 0.75, 0.04, 48]} />
        <meshStandardMaterial color="#f1f5f9" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function ReagentBottle({ x, color, label }: { x: number; color: string; label: string }) {
  return (
    <group position={[x, -0.35, -0.9]}>
      <mesh>
        <cylinderGeometry args={[0.28, 0.28, 0.7, 32]} />
        <meshStandardMaterial color={color} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.15, 24]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, -0.12, 0.29]}>
        <planeGeometry args={[0.4, 0.2]} />
        <meshBasicMaterial color="#f8fafc" />
      </mesh>
    </group>
  );
}

export function LabScene({ state }: { state: BeakerState }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.5, 1.8, 3.5], fov: 45 }}
      className="!bg-transparent"
    >
      <color attach="background" args={["#0f172a"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 6, 3]} intensity={1.1} castShadow />
      <pointLight position={[-3, 2, -2]} intensity={0.6} color="#22d3ee" />
      <Environment preset="city" />
      <LabTable />
      <BeakerMesh state={state} />
      <ReagentBottle x={-2} color="#7dd3fc" label="H₂O" />
      <ReagentBottle x={-1.3} color="#fef3c7" label="HCl" />
      <ReagentBottle x={1.3} color="#dbeafe" label="NaOH" />
      <ReagentBottle x={2} color="#f9a8d4" label="PP" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={7} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
