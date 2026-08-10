import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const SECTION_ORDER = ["home", "work", "projects", "notes", "about", "contact"];

const CAMERA_PRESETS = {
  home: { position: [0.9, 1.5, 8.5], target: [0.2, -0.2, -4.8], fov: 47 },
  work: { position: [0.2, 1.2, 4.4], target: [0.5, -0.4, -9.2], fov: 44 },
  projects: { position: [-0.6, 1.15, -4.2], target: [-0.15, -0.45, -18.2], fov: 45 },
  notes: { position: [0.8, 1.45, -13.2], target: [0.3, -0.35, -27.2], fov: 44 },
  about: { position: [-0.55, 1.8, -22.2], target: [0.2, -0.25, -36.1], fov: 46 },
  contact: { position: [0.35, 1.25, -31.1], target: [0, -0.55, -45.3], fov: 45 },
};

const BAY_LABELS = [
  ["01", "WORK"],
  ["02", "PROJECTS"],
  ["03", "NOTES"],
  ["04", "ABOUT"],
  ["05", "CONTACT"],
];

function prepareTexture(texture, repeatX, repeatY) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function CameraRig({ section, focusIndex, reducedMotion }) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, -0.2, -4.8));
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const preset = CAMERA_PRESETS[section] || CAMERA_PRESETS.home;
    const detailOffset = section === "work" || section === "projects" || section === "notes"
      ? Math.min(2, Math.max(0, focusIndex || 0)) * 0.38
      : 0;
    desiredPosition.set(...preset.position);
    desiredTarget.set(...preset.target);
    desiredPosition.z -= detailOffset;
    desiredTarget.z -= detailOffset;

    if (!reducedMotion) {
      desiredPosition.x += state.pointer.x * 0.55;
      desiredPosition.y += state.pointer.y * 0.28;
      desiredTarget.x += state.pointer.x * 0.22;
    }

    const damping = reducedMotion ? 20 : 3.5;
    const alpha = 1 - Math.exp(-damping * delta);
    camera.position.lerp(desiredPosition, alpha);
    currentTarget.current.lerp(desiredTarget, alpha);
    camera.fov = THREE.MathUtils.damp(camera.fov, preset.fov, damping, delta);
    camera.updateProjectionMatrix();
    camera.lookAt(currentTarget.current);
  });

  return null;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.035).texture;
    scene.environment = environment;
    return () => {
      scene.environment = null;
      environment.dispose();
      room.dispose();
      generator.dispose();
    };
  }, [gl, scene]);

  return null;
}

function CorridorBay({ index, concrete, active, signalMode }) {
  const z = -8.5 - index * 9;
  const side = index % 2 === 0 ? 1 : -1;
  const slabX = side * 1.75;
  const [number, label] = BAY_LABELS[index];

  return (
    <group position={[0, 0, z]}>
      <mesh castShadow receiveShadow position={[-4.7, 1.15, 0]}>
        <boxGeometry args={[1.25, 7.1, 2.65]} />
        <meshStandardMaterial map={concrete} bumpMap={concrete} bumpScale={0.035} color="#b8b8b3" roughness={0.9} metalness={0.02} envMapIntensity={0.42} />
      </mesh>
      <mesh castShadow receiveShadow position={[4.7, 1.15, -1.05]}>
        <boxGeometry args={[1.25, 7.1, 4.8]} />
        <meshStandardMaterial map={concrete} bumpMap={concrete} bumpScale={0.035} color="#aaa9a4" roughness={0.92} metalness={0.02} envMapIntensity={0.4} />
      </mesh>
      <mesh castShadow receiveShadow position={[slabX, 0.25, -0.15]}>
        <boxGeometry args={[1.92, 5.25, 0.48]} />
        <meshStandardMaterial
          map={concrete}
          bumpMap={concrete}
          bumpScale={0.025}
          color={active ? "#a9a8a3" : "#6f6f6b"}
          roughness={0.9}
          metalness={0.06}
          emissive={active && signalMode ? "#170008" : "#000000"}
          emissiveIntensity={active && signalMode ? 0.8 : 0}
        />
      </mesh>
      {active && (
        <mesh position={[slabX - 0.84, 1.55, 0.17]}>
          <circleGeometry args={[0.045, 18]} />
          <meshBasicMaterial color="#ff2f92" toneMapped={false} />
        </mesh>
      )}
      <mesh position={[slabX, -2.45, 0.19]}>
        <boxGeometry args={[1.92, 0.025, 0.025]} />
        <meshBasicMaterial color={active ? "#ff2f92" : "#5a5a58"} toneMapped={false} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 4.65, -1.2]}>
        <boxGeometry args={[8.2, 0.62, 2.1]} />
        <meshStandardMaterial map={concrete} bumpMap={concrete} bumpScale={0.025} color="#989792" roughness={0.93} envMapIntensity={0.38} />
      </mesh>
      <rectAreaLight
        position={[side * -2.7, 3.1, 1.1]}
        rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
        width={2.4}
        height={4.5}
        intensity={active ? 1.7 : 0.55}
        color={active ? "#f0eee9" : "#9e9e99"}
      />
    </group>
  );
}

function Corridor({ section, signalMode }) {
  const [concreteMap, backplateMap] = useTexture([
    "/assets/world/monolith-concrete.png",
    "/assets/editorial/corridor-backplate.png",
  ]);
  const concrete = useMemo(() => prepareTexture(concreteMap.clone(), 1.5, 2.8), [concreteMap]);
  const backplate = useMemo(() => {
    const texture = backplateMap.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [backplateMap]);
  const activeIndex = Math.max(0, SECTION_ORDER.indexOf(section) - 1);
  const routePoints = useMemo(() => [
    [-3.8, -2.08, 9],
    [-1.3, -2.08, 2],
    [1.25, -2.08, -8.4],
    [1.25, -2.08, -13],
    [-0.9, -2.08, -18],
    [0.9, -2.08, -27],
    [-0.7, -2.08, -36],
    [0.4, -2.08, -45],
  ], []);

  useEffect(() => () => {
    concrete.dispose();
    backplate.dispose();
  }, [backplate, concrete]);

  return (
    <group>
      <mesh position={[0, 8, -58]}>
        <planeGeometry args={[46, 74]} />
        <meshBasicMaterial map={backplate} fog={false} toneMapped={false} />
      </mesh>
      <mesh receiveShadow position={[0, -2.48, -20]}>
        <boxGeometry args={[12, 0.34, 65]} />
        <shadowMaterial color="#000000" transparent opacity={0.34} depthWrite={false} />
      </mesh>
      <mesh receiveShadow position={[-5.65, 1.2, -20]}>
        <boxGeometry args={[0.6, 7.6, 65]} />
        <meshStandardMaterial map={concrete} bumpMap={concrete} bumpScale={0.03} color="#8d8c88" roughness={0.94} envMapIntensity={0.38} />
      </mesh>
      <mesh receiveShadow position={[5.65, 1.2, -20]}>
        <boxGeometry args={[0.6, 7.6, 65]} />
        <meshStandardMaterial map={concrete} bumpMap={concrete} bumpScale={0.03} color="#85847f" roughness={0.95} envMapIntensity={0.36} />
      </mesh>
      {BAY_LABELS.map((_, index) => (
        <CorridorBay
          key={index}
          index={index}
          concrete={concrete}
          active={activeIndex === index}
          signalMode={signalMode}
        />
      ))}
      <Line
        points={routePoints}
        color="#ff2f92"
        lineWidth={signalMode ? 3.2 : 1.55}
        transparent
        opacity={signalMode ? 1 : 0.9}
        toneMapped={false}
      />
      <mesh position={[0, 5.25, -20]} receiveShadow>
        <boxGeometry args={[12, 0.3, 65]} />
        <meshStandardMaterial color="#252524" roughness={0.97} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <group key={index} position={[0, 4.95, 5 - index * 8]}>
          <mesh>
            <boxGeometry args={[8.6, 0.12, 0.12]} />
            <meshStandardMaterial color="#b9b9b4" emissive="#aaa9a5" emissiveIntensity={0.38} />
          </mesh>
          <pointLight position={[0, -0.5, 0]} intensity={0.58} distance={8} color="#e5e2db" />
        </group>
      ))}
    </group>
  );
}

function Scene({ section, focusIndex, reducedMotion, signalMode }) {
  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#090909", 18, 58]} />
      <StudioEnvironment />
      <hemisphereLight intensity={0.5} color="#efece5" groundColor="#090909" />
      <ambientLight intensity={0.22} color="#d8d5ce" />
      <directionalLight
        position={[-4, 8, 9]}
        intensity={2.7}
        color="#f2eee6"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={38}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={11}
        shadow-camera-bottom={-11}
      />
      <spotLight position={[3, 6, -8]} target-position={[0, 0, -12]} intensity={5.4} angle={0.46} penumbra={0.82} distance={36} color="#e5e1d9" />
      <Corridor section={section} signalMode={signalMode} />
      <CameraRig section={section} focusIndex={focusIndex} reducedMotion={reducedMotion} />
    </>
  );
}

export function EditorialWorld({ section, focusIndex = 0, reducedMotion = false, signalMode = false }) {
  return (
    <Canvas
      className="editorial-world-canvas"
      camera={{ position: CAMERA_PRESETS.home.position, fov: CAMERA_PRESETS.home.fov, near: 0.1, far: 120 }}
      dpr={[1, 1.3]}
      gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      shadows
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.5;
        gl.shadowMap.type = THREE.PCFShadowMap;
      }}
    >
      <Suspense fallback={null}>
        <Scene
          section={section}
          focusIndex={focusIndex}
          reducedMotion={reducedMotion}
          signalMode={signalMode}
        />
      </Suspense>
    </Canvas>
  );
}
