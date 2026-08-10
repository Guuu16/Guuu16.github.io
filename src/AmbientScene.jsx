import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function DustField({ reducedMotion }) {
  const points = useRef();
  const positions = useMemo(() => {
    const values = new Float32Array(150 * 3);
    for (let i = 0; i < 150; i += 1) {
      values[i * 3] = (Math.random() - 0.5) * 13;
      values[i * 3 + 1] = (Math.random() - 0.5) * 8;
      values[i * 3 + 2] = Math.random() * 4 - 1;
    }
    return values;
  }, []);

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    points.current.rotation.y += delta * 0.006;
    points.current.position.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.08;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.026}
        color="#e2aa61"
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingSpecks({ reducedMotion }) {
  const group = useRef();

  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.015;
  });

  return (
    <group ref={group} position={[0, 0, 0.4]}>
      <mesh position={[-4.2, 1.8, 0]}>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color="#ffe0a3" transparent opacity={0.7} />
      </mesh>
      <mesh position={[4.5, -0.5, 0]}>
        <sphereGeometry args={[0.025, 10, 10]} />
        <meshBasicMaterial color="#70e6ce" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-3.4, -2.3, 0]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshBasicMaterial color="#f1bf79" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

export function AmbientScene({ reducedMotion }) {
  return (
    <Canvas
      className="ambient-canvas"
      orthographic
      camera={{ position: [0, 0, 8], zoom: 72 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
    >
      <DustField reducedMotion={reducedMotion} />
      <FloatingSpecks reducedMotion={reducedMotion} />
    </Canvas>
  );
}
