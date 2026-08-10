import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, extend, useFrame, useLoader, useThree } from "@react-three/fiber";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Howl } from "howler";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Flask,
  GearSix,
  House,
  MagnifyingGlass,
  Notebook,
  SpeakerHigh,
  SpeakerSlash,
  Television,
  UserCircle,
  X,
} from "@phosphor-icons/react";
import "./studio-world.css";

extend({ RoundedBoxGeometry });

const SECTION_META = {
  intro: { label: "频道中枢", eyebrow: "HOME SIGNAL", icon: Television },
  notes: { label: "笔记管理", eyebrow: "FIELD NOTES", icon: Notebook },
  projects: { label: "项目实验", eyebrow: "PROTOTYPE DECK", icon: Flask },
  work: { label: "工作经历", eyebrow: "CAREER ARCHIVE", icon: Briefcase },
  about: { label: "关于我", eyebrow: "PORTRAIT FILE", icon: UserCircle },
};

const VIEW_PRESETS = {
  idle: { position: [0, 4.65, 13.35], look: [0, 0.38, -1.15] },
  intro: { position: [0.15, 1.75, 4.15], look: [0, 0.22, -1.28] },
  notes: { position: [-3.35, 2.1, 4.45], look: [-4.15, -0.52, 1.02] },
  projects: { position: [0.55, 1.9, 4.4], look: [1.28, -0.42, 1.48] },
  work: { position: [3.2, 2.15, 4.2], look: [4.4, -0.18, 0.48] },
  about: { position: [2.25, 1.85, 3.65], look: [3.4, 0.02, -0.66] },
};

const soundBank = {
  focus: new Howl({ src: ["/assets/audio/tune.wav"], volume: 0.22 }),
  click: new Howl({ src: ["/assets/audio/click.wav"], volume: 0.2 }),
  reveal: new Howl({ src: ["/assets/audio/power-on.wav"], volume: 0.18 }),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function useCrtTexture(profile) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const context = canvas.getContext("2d");
    context.fillStyle = "#071b17";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const glow = context.createRadialGradient(520, 270, 30, 520, 270, 620);
    glow.addColorStop(0, "rgba(92, 190, 145, .16)");
    glow.addColorStop(1, "rgba(2, 12, 10, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "#e7dfbd";
    context.font = "700 74px 'Barlow Condensed', sans-serif";
    context.fillText("DEEP-NIGHT", 82, 150);
    context.fillStyle = "#e3b965";
    context.fillText("STUDIO", 82, 226);
    context.fillStyle = "rgba(181, 231, 204, .88)";
    context.font = "500 24px 'PingFang SC', sans-serif";
    context.fillText("CH 00  /  PERSONAL ARCHIVE", 86, 290);
    context.fillStyle = "rgba(220, 235, 221, .76)";
    context.font = "500 29px 'PingFang SC', sans-serif";
    context.fillText(profile.headline, 86, 390);
    context.font = "500 23px 'PingFang SC', sans-serif";
    context.fillText("拖动桌面，找到属于我的工作、笔记与实验。", 86, 448);
    context.fillStyle = "rgba(227, 185, 101, .8)";
    context.fillText("2026-07-29  ·  SIGNAL STABLE", 86, 536);

    for (let y = 0; y < canvas.height; y += 4) {
      context.fillStyle = y % 8 === 0 ? "rgba(224,255,238,.025)" : "rgba(0,0,0,.035)";
      context.fillRect(0, y, canvas.width, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
  }, [profile.headline]);
}

function useAvatarTexture(path) {
  const texture = useLoader(THREE.TextureLoader, path);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

function CameraRig({ active, orbitRef, reducedMotion }) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(...VIEW_PRESETS.idle.look));
  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const preset = VIEW_PRESETS[active || "idle"];
    const orbit = orbitRef.current;
    if (active) {
      desiredPosition.current.set(...preset.position);
      desiredLook.current.set(...preset.look);
    } else {
      const radius = 14.05 - orbit.zoom * 5.05;
      const azimuth = orbit.yaw * 0.72 + orbit.pointerX * 0.035;
      const elevation = 0.29 + orbit.pitch * 0.42 - orbit.pointerY * 0.025;
      const horizontalRadius = Math.cos(elevation) * radius;
      desiredPosition.current.set(
        Math.sin(azimuth) * horizontalRadius,
        0.45 + Math.sin(elevation) * radius,
        Math.cos(azimuth) * horizontalRadius - 0.15,
      );
      desiredLook.current.set(orbit.yaw * 0.42, 0.45 + orbit.pitch * 0.16, -1.2);
    }

    const positionSpeed = reducedMotion ? 18 : active ? 2.6 : 3.9;
    const lookSpeed = reducedMotion ? 18 : active ? 3.15 : 4.4;
    camera.position.lerp(desiredPosition.current, 1 - Math.exp(-delta * positionSpeed));
    lookAt.current.lerp(desiredLook.current, 1 - Math.exp(-delta * lookSpeed));
    camera.lookAt(lookAt.current);
    camera.fov = THREE.MathUtils.lerp(camera.fov, active ? 42 : 48, 1 - Math.exp(-delta * 3));
    camera.updateProjectionMatrix();

    state.scene.fog.near = THREE.MathUtils.lerp(state.scene.fog.near, active ? 8 : 10, 0.04);
  });
  return null;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const environment = generator.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.2;
    return () => {
      scene.environment = null;
      scene.environmentIntensity = 1;
      environment.dispose();
      generator.dispose();
    };
  }, [gl, scene]);

  return null;
}

function Dust({ starMode }) {
  const pointsRef = useRef();
  const geometry = useMemo(() => {
    const positions = new Float32Array(540 * 3);
    for (let index = 0; index < 540; index += 1) {
      positions[index * 3] = (Math.random() - 0.5) * 18;
      positions[index * 3 + 1] = Math.random() * 8 - 1.1;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return buffer;
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * (starMode ? 0.026 : 0.008);
    pointsRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.22) * 0.06;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={starMode ? "#9ce8d0" : "#d7c69d"}
        size={starMode ? 0.035 : 0.022}
        opacity={starMode ? 0.7 : 0.38}
        transparent
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function RoomShell({ starMode, onEgg }) {
  const backdropTexture = useAvatarTexture("/assets/world/observatory-backplate-v4.png");
  const cityLights = useMemo(() => Array.from({ length: 126 }, (_, index) => ({
    x: -10.4 + (index % 21) * 0.48,
    y: -0.9 + Math.floor(index / 21) * 0.55 + ((index * 13) % 3) * 0.08,
    height: 0.08 + ((index * 17) % 5) * 0.035,
    lit: (index * 7) % 5 !== 0,
  })), []);
  const drawers = useMemo(() => Array.from({ length: 72 }, (_, index) => ({
    x: -2.75 + (index % 8) * 0.78,
    y: -1.6 + Math.floor(index / 8) * 0.54,
  })), []);
  const ceilingBeams = useMemo(() => [-9.5, -6.2, -2.9, 0.4, 3.7, 7], []);
  const stairSteps = useMemo(() => Array.from({ length: 17 }, (_, index) => index), []);
  const consoleRows = useMemo(() => [-6.8, -4.4], []);

  return (
    <group>
      <mesh position={[0, 3.25, -11.45]}>
        <planeGeometry args={[30, 11.6]} />
        <meshBasicMaterial map={backdropTexture} color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0, -3.2, -1]} receiveShadow>
        <boxGeometry args={[30, 0.45, 25]} />
        <meshStandardMaterial color="#151614" roughness={0.9} metalness={0.12} />
      </mesh>
      <mesh position={[-19.5, 2.8, -1]} receiveShadow>
        <boxGeometry args={[0.42, 12, 25]} />
        <meshStandardMaterial color="#111310" roughness={0.94} />
      </mesh>
      <mesh position={[19.5, 2.8, -1]} receiveShadow>
        <boxGeometry args={[0.42, 12, 25]} />
        <meshStandardMaterial color="#111310" roughness={0.94} />
      </mesh>

      <group position={[-5.35, 1.65, -10.45]}>
        <mesh position={[0, 1.85, -0.12]}>
          <planeGeometry args={[12.7, 9.2]} />
          <meshPhysicalMaterial color="#07131a" transparent opacity={0.28} transmission={0.12} roughness={0.16} metalness={0.18} />
        </mesh>
        {cityLights.map((light, index) => (
          <mesh key={index} position={[light.x + 5.35, light.y + 1.4, 0.04]}>
            <boxGeometry args={[0.045, light.height, 0.025]} />
            <meshBasicMaterial color={light.lit ? "#ddb873" : "#29414b"} transparent opacity={light.lit ? 0.92 : 0.28} />
          </mesh>
        ))}
        {[-6.35, -2.1, 2.1, 6.35].map((x) => (
          <mesh key={`window-v-${x}`} position={[x, 1.85, 0.2]}>
            <boxGeometry args={[0.18, 9.45, 0.28]} />
            <meshStandardMaterial color="#151a19" metalness={0.72} roughness={0.42} />
          </mesh>
        ))}
        {[-2.75, 1.85, 6.45].map((y) => (
          <mesh key={`window-h-${y}`} position={[0, y, 0.2]}>
            <boxGeometry args={[12.9, 0.18, 0.28]} />
            <meshStandardMaterial color="#151a19" metalness={0.72} roughness={0.42} />
          </mesh>
        ))}
      </group>

      <group position={[7.65, 0.05, -10.2]}>
        {drawers.map((drawer, index) => (
          <group key={index} position={[drawer.x, drawer.y, 0.15]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.44, 0.34]} />
              <meshStandardMaterial color={index % 4 === 0 ? "#302a20" : "#22241f"} roughness={0.76} metalness={0.16} />
            </mesh>
            <mesh position={[0, -0.02, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.05, 0.012, 8, 16]} />
              <meshStandardMaterial color="#987442" metalness={0.82} roughness={0.34} />
            </mesh>
          </group>
        ))}
      </group>

      <group position={[6.4, 3.9, -6.55]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[14.2, 0.18, 2.08]} />
          <meshStandardMaterial color="#171916" metalness={0.58} roughness={0.48} />
        </mesh>
        {Array.from({ length: 15 }, (_, index) => -6.8 + index * 0.98).map((x) => (
          <mesh key={`rail-post-${x}`} position={[x, 1.02, 0.96]}>
            <boxGeometry args={[0.08, 2, 0.08]} />
            <meshStandardMaterial color="#242720" metalness={0.82} roughness={0.34} />
          </mesh>
        ))}
        {[0.35, 1.25, 2].map((y) => (
          <mesh key={`rail-${y}`} position={[0, y, 0.96]}>
            <boxGeometry args={[14.1, 0.07, 0.08]} />
            <meshStandardMaterial color="#242720" metalness={0.82} roughness={0.34} />
          </mesh>
        ))}
        <pointLight position={[1.6, 1.1, 0.4]} color="#e4a65a" intensity={8} distance={6} decay={2} />
      </group>

      <group position={[0.9, -2.7, -5.25]} rotation={[0, -0.03, 0]}>
        {stairSteps.map((step) => (
          <mesh key={step} position={[step * 0.46, step * 0.39, -step * 0.1]} castShadow receiveShadow>
            <boxGeometry args={[2.15, 0.09, 0.56]} />
            <meshStandardMaterial color="#252621" metalness={0.7} roughness={0.42} />
          </mesh>
        ))}
        <LampRod start={[-1.08, 0.2, 0.42]} end={[8.1, 6.7, -1.15]} radius={0.06} color="#2d3029" />
        <LampRod start={[1.08, 0.2, 0.42]} end={[10.25, 6.7, -1.15]} radius={0.06} color="#2d3029" />
      </group>

      {ceilingBeams.map((z) => (
        <group key={z} position={[0, 9.15, z]}>
          <mesh castShadow>
            <boxGeometry args={[28, 0.22, 0.22]} />
            <meshStandardMaterial color="#171916" metalness={0.76} roughness={0.4} />
          </mesh>
          <LampRod start={[-13.6, 0, 0]} end={[-7, -2.1, 0]} radius={0.08} color="#1b1d19" />
          <LampRod start={[-7, -2.1, 0]} end={[0, 0, 0]} radius={0.08} color="#1b1d19" />
          <LampRod start={[0, 0, 0]} end={[7, -2.1, 0]} radius={0.08} color="#1b1d19" />
          <LampRod start={[7, -2.1, 0]} end={[13.6, 0, 0]} radius={0.08} color="#1b1d19" />
        </group>
      ))}

      {[
        [-8.2, 6.7, -5.8],
        [-3.6, 7.4, -6.7],
        [1.1, 6.55, -6.2],
        [5.7, 7.1, -7.4],
        [10.1, 6.35, -6.35],
      ].map(([x, y, z], index) => (
        <group key={`pendant-${x}`} position={[x, y, z]}>
          <mesh position={[0, (9.1 - y) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 9.1 - y, 8]} />
            <meshStandardMaterial color="#191b18" metalness={0.6} roughness={0.48} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]} castShadow>
            <coneGeometry args={[0.46, 0.54, 32, 1, true]} />
            <meshStandardMaterial color="#24251f" side={THREE.DoubleSide} metalness={0.64} roughness={0.42} />
          </mesh>
          <mesh position={[0, -0.31, 0]}>
            <sphereGeometry args={[0.13, 18, 14]} />
            <meshBasicMaterial color={index % 2 ? "#f4c476" : "#dba75d"} />
          </mesh>
          <pointLight position={[0, -0.42, 0]} color={index % 2 ? "#efb969" : "#d99b4f"} intensity={12} distance={7.2} decay={2} />
        </group>
      ))}

      {consoleRows.map((z, row) => (
        <group key={z} position={[-2.8 + row * 1.1, -2.15, z]} rotation={[0, row ? -0.05 : 0.04, 0]}>
          {[-5.2, -1.8, 1.6, 5].map((x, index) => (
            <group key={x} position={[x, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[2.65, 1.45, 1.2]} />
                <meshStandardMaterial color="#1c201d" metalness={0.38} roughness={0.62} />
              </mesh>
              <mesh position={[0, 0.34, 0.62]}>
                <planeGeometry args={[1.45, 0.48]} />
                <meshBasicMaterial color={index % 2 ? "#9fc7bf" : "#d4a766"} transparent opacity={0.5} />
              </mesh>
              {[-0.85, -0.55, -0.25, 0.05].map((y) => (
                <mesh key={y} position={[0, y, 0.64]}>
                  <boxGeometry args={[1.75, 0.08, 0.05]} />
                  <meshStandardMaterial color="#66543a" metalness={0.48} roughness={0.52} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}

      <group position={[10.6, 1.8, -9.65]} onClick={(event) => { event.stopPropagation(); onEgg("clock", "03:17 — 整座观测站还没有睡"); }}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.7, 0.2, 48]} />
          <meshStandardMaterial color="#171814" roughness={0.62} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.58, 0.58, 0.035, 48]} />
          <meshStandardMaterial color="#c8b986" roughness={0.86} />
        </mesh>
        <mesh position={[0.16, 0, 0.155]} rotation={[0, 0, -0.28]}>
          <boxGeometry args={[0.42, 0.035, 0.04]} />
          <meshStandardMaterial color="#1b211f" metalness={0.5} roughness={0.65} />
        </mesh>
      </group>

      <group position={[9.3, 2.7, -9.55]} onClick={(event) => { event.stopPropagation(); onEgg("star", "城市灯光短暂连成了一张星图"); }}>
        <mesh>
          <sphereGeometry args={[0.09, 18, 18]} />
          <meshStandardMaterial color={starMode ? "#b8ffe3" : "#e8bd68"} emissive={starMode ? "#77e6bd" : "#b47a27"} emissiveIntensity={starMode ? 3 : 1.4} />
        </mesh>
        <pointLight color={starMode ? "#86edc7" : "#e9b95c"} intensity={starMode ? 4.2 : 1.5} distance={4.6} decay={2} />
      </group>
    </group>
  );
}

function DeskBase({ drawerOpen, onDrawer }) {
  const woodTexture = useAvatarTexture("/assets/world/walnut-texture.png");
  const drawerRef = useRef();
  useEffect(() => {
    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2.8, 1.4);
    woodTexture.needsUpdate = true;
  }, [woodTexture]);
  useFrame((_, delta) => {
    if (!drawerRef.current) return;
    drawerRef.current.position.z = THREE.MathUtils.damp(drawerRef.current.position.z, drawerOpen ? 3.7 : 3.15, 4.5, delta);
  });

  return (
    <group>
      <mesh position={[0, -1.05, -0.15]} receiveShadow castShadow>
        <boxGeometry args={[16.4, 0.68, 8.3]} />
        <meshStandardMaterial map={woodTexture} color="#8b6247" roughness={0.7} metalness={0.02} />
      </mesh>
      <mesh position={[0, -1.42, 3.35]} receiveShadow>
        <boxGeometry args={[16.1, 0.13, 0.3]} />
        <meshStandardMaterial color="#19130f" roughness={0.88} />
      </mesh>
      <mesh position={[-5.4, -2.1, 0.2]} castShadow>
        <boxGeometry args={[3.5, 1.9, 6.2]} />
        <meshStandardMaterial color="#24180f" roughness={0.82} />
      </mesh>
      <mesh position={[5.3, -2.1, 0.2]} castShadow>
        <boxGeometry args={[3.7, 1.9, 6.2]} />
        <meshStandardMaterial color="#24180f" roughness={0.82} />
      </mesh>
      <group ref={drawerRef} position={[1.2, -1.7, 3.15]} onClick={(event) => { event.stopPropagation(); onDrawer(); }}>
        <mesh castShadow>
          <boxGeometry args={[3.15, 0.78, 1.25]} />
          <meshStandardMaterial color="#2a1c12" roughness={0.82} />
        </mesh>
        <mesh position={[0, 0.05, 0.68]}>
          <boxGeometry args={[0.5, 0.12, 0.1]} />
          <meshStandardMaterial color="#8d6b39" roughness={0.35} metalness={0.75} />
        </mesh>
        <pointLight position={[0, 0.15, -0.1]} color="#f2a54d" intensity={drawerOpen ? 3 : 0} distance={2.8} />
        {drawerOpen && (
          <mesh position={[0.55, 0.43, -0.1]} rotation={[-0.2, 0.25, 0]}>
            <boxGeometry args={[0.72, 0.03, 0.5]} />
            <meshStandardMaterial color="#c7ad72" roughness={0.92} emissive="#71481d" emissiveIntensity={0.18} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function InteractiveGroup({ id, hovered, active, orbitRef, onHover, onSelect, children, ...props }) {
  const lit = hovered === id || active === id;
  return (
    <group
      {...props}
      onPointerOver={(event) => { event.stopPropagation(); onHover(id); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
      onClick={(event) => {
        event.stopPropagation();
        if (!orbitRef.current.moved) onSelect(id);
      }}
    >
      {children(lit)}
    </group>
  );
}

function CrtStation({ profile, hovered, active, orbitRef, onHover, onSelect, knobStep, onKnob }) {
  const screenTexture = useCrtTexture(profile);
  const avatarTexture = useAvatarTexture("/assets/avatar/wink.png");
  const televisionGltf = useLoader(GLTFLoader, "/assets/models/television_01/Television_01_1k.gltf");
  const televisionModel = useMemo(() => {
    const clone = televisionGltf.scene.clone(true);
    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.material?.map) child.material.map.anisotropy = 8;
      if (child.material?.normalMap) child.material.normalMap.anisotropy = 8;
    });
    return clone;
  }, [televisionGltf]);
  const knobRef = useRef();
  const hostRef = useRef();

  useFrame((state, delta) => {
    if (knobRef.current) knobRef.current.rotation.z = THREE.MathUtils.damp(knobRef.current.rotation.z, knobStep * Math.PI * 0.48, 7, delta);
    if (hostRef.current) hostRef.current.position.y = -0.26 + Math.sin(state.clock.elapsedTime * 1.55) * 0.035;
  });

  return (
    <group>
      <InteractiveGroup id="intro" hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} position={[0, 0.15, -1.3]}>
        {(lit) => (
          <>
            <primitive object={televisionModel} position={[0, -1.36, 0]} scale={[6.6, 6.6, 4]} />
            <mesh position={[-0.39, 0.08, 0.89]}>
              <planeGeometry args={[2.72, 2.02]} />
              <meshBasicMaterial map={screenTexture} toneMapped={false} />
            </mesh>
            <mesh position={[-0.39, 0.08, 0.91]}>
              <planeGeometry args={[2.78, 2.08]} />
              <meshPhysicalMaterial color="#9dd9c0" transparent opacity={0.1} transmission={0.12} roughness={0.18} metalness={0.02} />
            </mesh>
            <mesh position={[-0.39, 0.08, 0.93]}>
              <planeGeometry args={[2.84, 2.14]} />
              <meshBasicMaterial color="#9be8c4" transparent opacity={lit ? 0.075 : 0.03} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <pointLight position={[-0.4, 0.3, 1.4]} color="#7ad5ac" intensity={lit ? 2.4 : 1.3} distance={4.2} />
          </>
        )}
      </InteractiveGroup>

      <group
        position={[1.47, 0.94, -0.37]}
        onPointerOver={(event) => { event.stopPropagation(); onHover("knob"); }}
        onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
        onClick={(event) => { event.stopPropagation(); if (!orbitRef.current.moved) onKnob(); }}
      >
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.39, 0.39, 0.18, 40]} />
          <meshStandardMaterial color="#2b271d" roughness={0.38} metalness={0.72} />
        </mesh>
        <group ref={knobRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.27, 0.3, 0.25, 36]} />
            <meshStandardMaterial color="#161713" roughness={0.3} metalness={0.76} />
          </mesh>
          <mesh position={[0, 0.21, 0.15]} rotation={[0, 0, -0.48]}>
            <boxGeometry args={[0.08, 0.27, 0.07]} />
            <meshStandardMaterial color="#e0ae55" emissive="#8b5719" emissiveIntensity={0.65} />
          </mesh>
        </group>
      </group>

      <group ref={hostRef} position={[2.0, -0.26, -0.25]} rotation={[0, -0.18, 0]}>
        <mesh>
          <planeGeometry args={[1.34, 1.34]} />
          <meshBasicMaterial map={avatarTexture} transparent alphaTest={0.08} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function NotebookStation({ hovered, active, orbitRef, onHover, onSelect }) {
  const paperSpread = useAvatarTexture("/assets/world/notebook-spread-v2.png");
  const pageTextures = useMemo(() => {
    const left = paperSpread.clone();
    const right = paperSpread.clone();
    left.repeat.set(0.5, 1);
    left.offset.set(0, 0);
    right.repeat.set(0.5, 1);
    right.offset.set(0.5, 0);
    left.needsUpdate = true;
    right.needsUpdate = true;
    return { left, right };
  }, [paperSpread]);
  useEffect(() => {
    pageTextures.left.colorSpace = THREE.SRGBColorSpace;
    pageTextures.right.colorSpace = THREE.SRGBColorSpace;
  }, [pageTextures]);
  return (
    <InteractiveGroup id="notes" hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} position={[-4.25, -0.54, 1.05]} rotation={[-0.03, 0.18, 0.02]}>
      {(lit) => (
        <>
          <mesh position={[-1.02, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.05, 0.12, 2.75]} />
            <meshStandardMaterial map={pageTextures.left} color="#c9b98d" roughness={0.94} emissive={lit ? "#6f5524" : "#000000"} emissiveIntensity={lit ? 0.28 : 0} />
          </mesh>
          <mesh position={[1.02, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.05, 0.12, 2.75]} />
            <meshStandardMaterial map={pageTextures.right} color="#cfbf94" roughness={0.94} emissive={lit ? "#6f5524" : "#000000"} emissiveIntensity={lit ? 0.28 : 0} />
          </mesh>
          <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 2.64, 12]} />
            <meshStandardMaterial color="#4d3925" roughness={0.52} metalness={0.35} />
          </mesh>
          {Array.from({ length: 6 }, (_, index) => (
            <mesh key={index} visible={false} position={[-1.05, 0.075, -0.9 + index * 0.33]}>
              <boxGeometry args={[1.45, 0.006, 0.018]} />
              <meshBasicMaterial color="#66583f" transparent opacity={0.5} />
            </mesh>
          ))}
          {Array.from({ length: 5 }, (_, index) => (
            <mesh key={index} visible={false} position={[1.05, 0.075, -0.55 + index * 0.34]} rotation={[0, 0.2, 0]}>
              <boxGeometry args={[1.25 - index * 0.08, 0.006, 0.018]} />
              <meshBasicMaterial color="#66583f" transparent opacity={0.45} />
            </mesh>
          ))}
          <pointLight position={[0, 0.5, 0]} color="#e5bd70" intensity={lit ? 2.1 : 0} distance={3.5} />
        </>
      )}
    </InteractiveGroup>
  );
}

function ProjectStation({ hovered, active, orbitRef, onHover, onSelect }) {
  const reelA = useRef();
  const reelB = useRef();
  const brassCorners = [
    [-1.25, 0.34, -0.9], [1.25, 0.34, -0.9],
    [-1.25, 0.34, 0.9], [1.25, 0.34, 0.9],
  ];
  useFrame((_, delta) => {
    const speed = active === "projects" ? 2.1 : 0.22;
    if (reelA.current) reelA.current.rotation.y += delta * speed;
    if (reelB.current) reelB.current.rotation.y -= delta * speed * 0.8;
  });

  return (
    <InteractiveGroup id="projects" hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} position={[1.3, -0.45, 1.55]} rotation={[0, -0.08, 0]}>
      {(lit) => (
        <>
          <mesh castShadow receiveShadow>
            <roundedBoxGeometry args={[2.65, 0.58, 1.95, 5, 0.1]} />
            <meshPhysicalMaterial color="#6c7b70" transparent opacity={0.42} transmission={0.32} roughness={0.18} metalness={0.32} emissive={lit ? "#6aa889" : "#000000"} emissiveIntensity={lit ? 0.45 : 0} />
          </mesh>
          {[-0.96, 0.96].map((z) => (
            <mesh key={`rail-z-${z}`} position={[0, 0.34, z]}>
              <boxGeometry args={[2.62, 0.055, 0.055]} />
              <meshStandardMaterial color="#96723e" metalness={0.84} roughness={0.32} />
            </mesh>
          ))}
          {[-1.31, 1.31].map((x) => (
            <mesh key={`rail-x-${x}`} position={[x, 0.34, 0]}>
              <boxGeometry args={[0.055, 0.055, 1.9]} />
              <meshStandardMaterial color="#96723e" metalness={0.84} roughness={0.32} />
            </mesh>
          ))}
          {brassCorners.map(([x, y, z]) => (
            <mesh key={`${x}-${z}`} position={[x, y + 0.025, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.045, 18]} />
              <meshStandardMaterial color="#bb9250" metalness={0.9} roughness={0.24} />
            </mesh>
          ))}
          {[-0.62, 0.62].map((x, index) => (
            <group key={x} position={[x, 0.34, 0]} ref={index === 0 ? reelA : reelB}>
              <mesh>
                <cylinderGeometry args={[0.4, 0.4, 0.12, 32]} />
                <meshStandardMaterial color="#212720" metalness={0.72} roughness={0.36} />
              </mesh>
              {Array.from({ length: 4 }, (_, spoke) => (
                <mesh key={spoke} rotation={[0, (Math.PI / 2) * spoke, 0]} position={[0, 0.07, 0]}>
                  <boxGeometry args={[0.48, 0.04, 0.08]} />
                  <meshStandardMaterial color="#84663b" metalness={0.72} roughness={0.4} />
                </mesh>
              ))}
            </group>
          ))}
          <mesh position={[0, 0.36, 0.78]}>
            <boxGeometry args={[1.15, 0.07, 0.18]} />
            <meshStandardMaterial color="#b79c61" roughness={0.78} />
          </mesh>
          <pointLight position={[0, 0.68, 0]} color="#76d9b0" intensity={lit ? 2.4 : 0.35} distance={3.8} />
        </>
      )}
    </InteractiveGroup>
  );
}

function WorkStation({ hovered, active, orbitRef, onHover, onSelect }) {
  const cards = [0, 1, 2, 3];
  const paperTexture = useAvatarTexture("/assets/world/paper-texture.png");
  useEffect(() => {
    paperTexture.wrapS = THREE.RepeatWrapping;
    paperTexture.wrapT = THREE.RepeatWrapping;
    paperTexture.repeat.set(1.1, 1.4);
    paperTexture.needsUpdate = true;
  }, [paperTexture]);
  return (
    <InteractiveGroup id="work" hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} position={[4.45, -0.45, 0.5]} rotation={[0, -0.28, 0]}>
      {(lit) => (
        <>
          <mesh position={[0, -0.05, 0]} castShadow>
            <roundedBoxGeometry args={[2.45, 0.55, 2.1, 5, 0.1]} />
            <meshStandardMaterial color="#352719" metalness={0.4} roughness={0.55} emissive={lit ? "#71501f" : "#000000"} emissiveIntensity={lit ? 0.35 : 0} />
          </mesh>
          <mesh position={[0, 0.38, -0.84]} rotation={[-0.48, 0, 0]} castShadow>
            <boxGeometry args={[2.15, 1.2, 0.12]} />
            <meshStandardMaterial color="#8a7143" metalness={0.55} roughness={0.52} />
          </mesh>
          {cards.map((card) => (
            <mesh key={card} position={[0, 0.24 + card * 0.05, -0.2 - card * 0.12]} rotation={[-0.28, 0, 0]}>
              <boxGeometry args={[1.78 - card * 0.05, 0.04, 1.15]} />
              <meshStandardMaterial map={paperTexture} color={card % 2 ? "#b7a16f" : "#c6b681"} roughness={0.9} />
            </mesh>
          ))}
          <mesh position={[0, 0.52, 0.22]} rotation={[-0.28, 0, 0]}>
            <boxGeometry args={[1.25, 0.035, 0.11]} />
            <meshStandardMaterial color="#473a27" roughness={0.78} />
          </mesh>
          <mesh position={[-0.34, 0.48, 0.4]} rotation={[-0.28, 0, 0]}>
            <boxGeometry args={[0.58, 0.035, 0.075]} />
            <meshStandardMaterial color="#665238" roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.45, 0.96]}>
            <boxGeometry args={[1.3, 0.25, 0.1]} />
            <meshStandardMaterial color="#8a6734" roughness={0.4} metalness={0.75} />
          </mesh>
          <pointLight position={[0, 0.9, 0.2]} color="#e3b35f" intensity={lit ? 2.3 : 0} distance={3.5} />
        </>
      )}
    </InteractiveGroup>
  );
}

function AboutStation({ hovered, active, orbitRef, onHover, onSelect }) {
  const avatarTexture = useAvatarTexture("/assets/avatar/confident.png");
  return (
    <InteractiveGroup id="about" hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} position={[3.4, -0.02, -0.65]} rotation={[0, -0.24, 0]}>
      {(lit) => (
        <>
          <mesh castShadow>
            <roundedBoxGeometry args={[1.75, 2.25, 0.22, 5, 0.07]} />
            <meshStandardMaterial color="#6d4d28" roughness={0.48} metalness={0.3} emissive={lit ? "#8f642f" : "#000000"} emissiveIntensity={lit ? 0.32 : 0} />
          </mesh>
          <mesh position={[0, 0.08, 0.13]}>
            <planeGeometry args={[1.4, 1.72]} />
            <meshStandardMaterial color="#baaa80" roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.07, 0.145]}>
            <planeGeometry args={[1.22, 1.45]} />
            <meshBasicMaterial map={avatarTexture} transparent alphaTest={0.08} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 0.4, 0.8]} color="#e3b66d" intensity={lit ? 1.7 : 0.2} distance={2.6} />
        </>
      )}
    </InteractiveGroup>
  );
}

function LampRod({ start, end, radius = 0.045, color = "#262721" }) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const startVector = new THREE.Vector3(...start);
    const endVector = new THREE.Vector3(...end);
    const direction = endVector.clone().sub(startVector);
    return {
      midpoint: startVector.clone().add(endVector).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
      length: direction.length(),
    };
  }, [start, end]);
  return (
    <mesh position={midpoint} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 12]} />
      <meshStandardMaterial color={color} metalness={0.82} roughness={0.31} />
    </mesh>
  );
}

function Lamp() {
  const shadeRef = useRef();
  const baseJoint = [0, -0.18, 0];
  const elbowJoint = [0.48, 1.15, 0];
  const headJoint = [1.45, 2.78, 0];
  useFrame((state) => {
    if (shadeRef.current) shadeRef.current.rotation.z = 0.12 + Math.sin(state.clock.elapsedTime * 0.24) * 0.012;
  });
  return (
    <group position={[-4.45, -0.35, -1.8]}>
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.72, 0.86, 0.18, 36]} />
        <meshStandardMaterial color="#1d1e19" metalness={0.66} roughness={0.38} />
      </mesh>
      <mesh position={baseJoint} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.19, 0.19, 0.22, 28]} />
        <meshStandardMaterial color="#736040" metalness={0.86} roughness={0.28} />
      </mesh>
      {[-0.075, 0.075].map((z) => (
        <LampRod key={`lower-${z}`} start={[baseJoint[0], baseJoint[1], z]} end={[elbowJoint[0], elbowJoint[1], z]} />
      ))}
      <LampRod start={[baseJoint[0], baseJoint[1] + 0.12, 0.13]} end={[elbowJoint[0], elbowJoint[1] - 0.12, 0.13]} radius={0.018} color="#8a7651" />
      <mesh position={elbowJoint} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.24, 28]} />
        <meshStandardMaterial color="#736040" metalness={0.86} roughness={0.28} />
      </mesh>
      {[-0.07, 0.07].map((z) => (
        <LampRod key={`upper-${z}`} start={[elbowJoint[0], elbowJoint[1], z]} end={[headJoint[0], headJoint[1], z]} />
      ))}
      <mesh position={headJoint} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.22, 28]} />
        <meshStandardMaterial color="#736040" metalness={0.86} roughness={0.28} />
      </mesh>
      <group ref={shadeRef} position={[1.45, 2.36, 0.05]} rotation={[0.1, 0, 0.12]}>
        <mesh castShadow>
          <coneGeometry args={[0.72, 0.86, 32, 1, true]} />
          <meshStandardMaterial color="#20211c" side={THREE.DoubleSide} metalness={0.54} roughness={0.46} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <sphereGeometry args={[0.18, 20, 16]} />
          <meshBasicMaterial color="#f1c678" />
        </mesh>
        <pointLight position={[0, -0.55, 0.05]} color="#ffd18a" intensity={54} distance={8} decay={2} castShadow />
      </group>
    </group>
  );
}

function DeskClutter() {
  const cableCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.1, -0.72, 2.8),
    new THREE.Vector3(1.1, -0.76, 2.55),
    new THREE.Vector3(2.65, -0.76, 2.9),
    new THREE.Vector3(4.4, -0.72, 2.35),
    new THREE.Vector3(5.6, -0.72, 2.55),
  ]), []);
  return (
    <group>
      <mesh castShadow>
        <tubeGeometry args={[cableCurve, 72, 0.032, 9, false]} />
        <meshStandardMaterial color="#11110e" roughness={0.68} metalness={0.18} />
      </mesh>
      {[-4.55, -4.15, -3.72].map((x, index) => (
        <group key={x} position={[x, -0.68 + index * 0.012, 2.48 + index * 0.14]} rotation={[Math.PI / 2, 0, 1.25 - index * 0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.1 - index * 0.08, 12]} />
            <meshStandardMaterial color={index === 1 ? "#25241d" : "#9b7840"} roughness={0.62} metalness={0.34} />
          </mesh>
          <mesh position={[0, 0.56 - index * 0.04, 0]}>
            <coneGeometry args={[0.055, 0.16, 10]} />
            <meshStandardMaterial color="#26241c" roughness={0.7} />
          </mesh>
        </group>
      ))}
      {[-2.1, 2.95, 5.1].map((x, index) => (
        <mesh key={x} position={[x, -0.69, 2.62 - index * 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.035, 18]} />
          <meshStandardMaterial color="#7c6946" roughness={0.32} metalness={0.9} />
        </mesh>
      ))}
      <mesh position={[-1.78, -0.7, 2.55]} rotation={[-Math.PI / 2, 0, -0.16]} receiveShadow>
        <planeGeometry args={[1.42, 0.92]} />
        <meshStandardMaterial color="#8e8060" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-1.8, -0.682, 2.55]} rotation={[-Math.PI / 2, 0, -0.16]}>
        <torusGeometry args={[0.31, 0.025, 16, 42]} />
        <meshBasicMaterial color="#493c2b" transparent opacity={0.36} />
      </mesh>
    </group>
  );
}

function MugEgg({ revealed, onReveal }) {
  const avatarTexture = useAvatarTexture("/assets/avatar/surprised.png");
  const avatarRef = useRef();
  useFrame((state, delta) => {
    if (!avatarRef.current) return;
    const targetY = revealed ? 0.66 + Math.sin(state.clock.elapsedTime * 2) * 0.04 : -0.2;
    avatarRef.current.position.y = THREE.MathUtils.damp(avatarRef.current.position.y, targetY, 5, delta);
    avatarRef.current.scale.setScalar(THREE.MathUtils.damp(avatarRef.current.scale.x, revealed ? 1 : 0.2, 5, delta));
  });
  return (
    <group position={[-0.9, -0.48, 1.25]} onClick={(event) => { event.stopPropagation(); onReveal(); }}>
      <mesh castShadow>
        <cylinderGeometry args={[0.42, 0.36, 0.75, 32]} />
        <meshStandardMaterial color="#151916" roughness={0.6} metalness={0.22} />
      </mesh>
      <mesh position={[0.48, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.07, 12, 28]} />
        <meshStandardMaterial color="#151916" roughness={0.6} metalness={0.22} />
      </mesh>
      <mesh ref={avatarRef} position={[0, -0.2, 0.02]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshBasicMaterial map={avatarTexture} transparent alphaTest={0.08} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function CraneEgg({ fly, onClick }) {
  const craneRef = useRef();
  useFrame((state, delta) => {
    if (!craneRef.current) return;
    const targetX = fly ? -1.5 + Math.sin(state.clock.elapsedTime * 0.7) * 2.5 : -5.8;
    const targetY = fly ? 2.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3 : -0.55;
    const targetZ = fly ? -0.3 : 2.25;
    craneRef.current.position.x = THREE.MathUtils.damp(craneRef.current.position.x, targetX, 2.2, delta);
    craneRef.current.position.y = THREE.MathUtils.damp(craneRef.current.position.y, targetY, 2.2, delta);
    craneRef.current.position.z = THREE.MathUtils.damp(craneRef.current.position.z, targetZ, 2.2, delta);
    craneRef.current.rotation.y += fly ? delta * 0.4 : 0;
  });
  return (
    <group ref={craneRef} position={[-5.8, -0.55, 2.25]} onClick={(event) => { event.stopPropagation(); onClick(); }}>
      <mesh rotation={[0.2, 0.15, 0.45]}>
        <tetrahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#c6b17c" roughness={0.96} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.22, 0.05, 0]} rotation={[0.2, 0.1, -0.25]} scale={[1.4, 0.35, 0.55]}>
        <tetrahedronGeometry args={[0.23, 0]} />
        <meshStandardMaterial color="#c6b17c" roughness={0.96} />
      </mesh>
      <mesh position={[0.22, 0.05, 0]} rotation={[-0.1, 0.2, 0.25]} scale={[1.4, 0.35, 0.55]}>
        <tetrahedronGeometry args={[0.23, 0]} />
        <meshStandardMaterial color="#c6b17c" roughness={0.96} />
      </mesh>
    </group>
  );
}

function StudioScene({ active, hovered, orbitRef, onHover, onSelect, knobStep, onKnob, eggs, onEgg, reducedMotion }) {
  return (
    <>
      <color attach="background" args={["#040706"]} />
      <fog attach="fog" args={["#07100e", 19, 48]} />
      <ambientLight intensity={0.62} color="#aec9c3" />
      <hemisphereLight args={["#8db7c0", "#563720", 1.28]} />
      <directionalLight position={[-5, 10, 7]} color="#bfd8d4" intensity={3.8} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0002} />
      <pointLight position={[6.2, 5.8, -5]} color="#e3a85a" intensity={30} distance={16} decay={2} />
      <pointLight position={[-7.5, 4.2, -7]} color="#78a9bb" intensity={24} distance={19} decay={2} />
      <pointLight position={[0, 1.8, 7]} color="#c5d7d0" intensity={10} distance={19} decay={2} />
      <spotLight position={[0, 10, 2]} angle={0.62} penumbra={0.72} color="#d6b075" intensity={36} distance={24} decay={2} castShadow />

      <CameraRig active={active} orbitRef={orbitRef} reducedMotion={reducedMotion} />
      <StudioEnvironment />
      <Dust starMode={eggs.star} />
      <RoomShell starMode={eggs.star} onEgg={onEgg} />
      <DeskBase drawerOpen={eggs.drawer} onDrawer={() => onEgg("drawer", "抽屉里的 NO.23 还没有完成") } />
      <DeskClutter />
      <Lamp />
      <CrtStation profile={eggs.profile} hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} knobStep={knobStep} onKnob={onKnob} />
      <NotebookStation hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} />
      <ProjectStation hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} />
      <WorkStation hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} />
      <AboutStation hovered={hovered} active={active} orbitRef={orbitRef} onHover={onHover} onSelect={onSelect} />
      <MugEgg revealed={eggs.mug} onReveal={() => onEgg("mug", "杯底藏着另一个值夜班的我") } />
      <CraneEgg fly={eggs.crane} onClick={() => onEgg("crane", "再点几次，也许它会飞") } />
    </>
  );
}

function IntroPanel({ profile, discovered }) {
  return (
    <div className="panel-copy intro-copy">
      <p className="panel-lead">{profile.intro}</p>
      <div className="intro-facts">
        <span>拖动环视</span>
        <span>滚轮推进</span>
        <span>点击物件</span>
      </div>
      <p className="panel-note">这个工作台里藏着 {Math.max(0, 6 - discovered)} 个还没有被发现的小秘密。</p>
    </div>
  );
}

function WorkPanel({ experiences }) {
  const visible = experiences.filter((item) => item.published);
  const [activeId, setActiveId] = useState(visible[0]?.id);
  const activeItem = visible.find((item) => item.id === activeId) || visible[0];
  return (
    <div className="panel-copy work-panel-copy">
      <div className="archive-list" role="list" aria-label="工作经历列表">
        {visible.map((item) => (
          <button type="button" key={item.id} onClick={() => setActiveId(item.id)} className={item.id === activeItem?.id ? "is-active" : ""}>
            <span>{item.period}</span><strong>{item.company}</strong><small>{item.role}</small>
          </button>
        ))}
      </div>
      {activeItem ? (
        <motion.article key={activeItem.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="archive-detail">
          <span>NOW PLAYING</span>
          <h3>{activeItem.role}</h3>
          <p>{activeItem.summary}</p>
          <div className="panel-tags">{activeItem.skills.map((skill) => <i key={skill}>{skill}</i>)}</div>
        </motion.article>
      ) : <p className="panel-empty">简历经历将在导入后显示在这里。</p>}
    </div>
  );
}

function NotesPanel({ notes }) {
  const visible = notes.filter((item) => item.published);
  const [query, setQuery] = useState("");
  const filtered = visible.filter((item) => `${item.title}${item.excerpt}${item.tag}`.toLowerCase().includes(query.toLowerCase()));
  const [activeId, setActiveId] = useState(visible[0]?.id);
  const activeNote = filtered.find((item) => item.id === activeId) || filtered[0];
  return (
    <div className="panel-copy notes-panel-copy">
      <label className="panel-search">
        <MagnifyingGlass aria-hidden="true" /><span className="sr-only">搜索笔记</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索记录…" />
      </label>
      <div className="notes-ledger">
        <div className="notes-list">
          {filtered.map((note) => (
            <button type="button" key={note.id} className={note.id === activeNote?.id ? "is-active" : ""} onClick={() => setActiveId(note.id)}>
              <span>{note.date}</span><strong>{note.title}</strong><small>{note.tag}</small>
            </button>
          ))}
        </div>
        {activeNote ? (
          <motion.article key={activeNote.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>{activeNote.tag} · {activeNote.date}</span>
            <h3>{activeNote.title}</h3>
            <p>{activeNote.content}</p>
          </motion.article>
        ) : <p className="panel-empty">没有找到相符的笔记。</p>}
      </div>
    </div>
  );
}

function ProjectsPanel({ projects }) {
  const visible = projects.filter((item) => item.published);
  const [index, setIndex] = useState(0);
  const project = visible[index];
  if (!project) return <p className="panel-empty">暂无已发布项目。</p>;
  const move = (direction) => setIndex((current) => (current + direction + visible.length) % visible.length);
  return (
    <div className="panel-copy projects-panel-copy">
      <div className="project-counter"><strong>{String(index + 1).padStart(2, "0")}</strong><span>/ {String(visible.length).padStart(2, "0")}</span></div>
      <motion.article key={project.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
        <span>{project.kicker}</span><h3>{project.title}</h3><p>{project.summary}</p>
        <div className="panel-tags">{project.tech.map((tech) => <i key={tech}>{tech}</i>)}</div>
      </motion.article>
      <div className="project-controls">
        <button type="button" onClick={() => move(-1)} aria-label="上一个项目"><ArrowLeft /></button>
        <button type="button" onClick={() => move(1)} aria-label="下一个项目"><ArrowRight /></button>
      </div>
    </div>
  );
}

function AboutPanel({ profile }) {
  return (
    <div className="panel-copy about-panel-copy">
      <p className="panel-lead">{profile.headline}</p>
      <p>{profile.intro}</p>
      <a href={`mailto:${profile.email}`}>{profile.email}</a>
      <div className="signature-line"><span />{profile.name}</div>
    </div>
  );
}

function ArchivePanel({ active, ready, content, discovered, onClose }) {
  const meta = SECTION_META[active];
  return (
    <AnimatePresence>
      {active && ready && meta && (
        <motion.aside
          key={active}
          className={`world-ui archive-panel archive-panel--${active}`}
          initial={{ opacity: 0, x: 34, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 22, scale: 0.985 }}
          transition={{ duration: 0.42, ease: [0.22, 0.8, 0.2, 1] }}
          aria-label={meta.label}
        >
          <header>
            <div><span>{meta.eyebrow}</span><h2>{meta.label}</h2></div>
            <button type="button" onClick={onClose} aria-label="返回工作台"><X weight="bold" /></button>
          </header>
          {active === "intro" && <IntroPanel profile={content.profile} discovered={discovered} />}
          {active === "work" && <WorkPanel experiences={content.experiences} />}
          {active === "notes" && <NotesPanel notes={content.notes} />}
          {active === "projects" && <ProjectsPanel projects={content.projects} />}
          {active === "about" && <AboutPanel profile={content.profile} />}
          <footer><ArrowLeft weight="bold" /> 按 ESC 沿原路径返回工作台</footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function WorldHotspots({ active, hovered, onHover, onSelect }) {
  const placements = {
    intro: { left: "45.5%", top: "51.2%", width: "14%", height: "19%" },
    notes: { left: "32.2%", top: "62.4%", width: "22%", height: "20%" },
    projects: { left: "55.4%", top: "62.1%", width: "17%", height: "17%" },
    work: { left: "70.5%", top: "56.4%", width: "16%", height: "19%" },
    about: { left: "61.5%", top: "52%", width: "10%", height: "17%" },
  };
  return (
    <nav className={`world-ui world-hotspots ${active ? "is-hidden" : ""}`} aria-label="工作台目的地">
      {Object.entries(SECTION_META).map(([id, item]) => {
        const Icon = item.icon;
        return (
          <button
            type="button"
            key={id}
            style={placements[id]}
            className={hovered === id ? "is-hovered" : ""}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => onHover(id)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(id)}
            aria-label={`进入${item.label}`}
          >
            <Icon weight="duotone" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function GrandStudio({ content, navigate }) {
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(null);
  const [panelReady, setPanelReady] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [knobStep, setKnobStep] = useState(0);
  const [eggToast, setEggToast] = useState("");
  const [discovered, setDiscovered] = useState(() => new Set());
  const [eggState, setEggState] = useState({ crane: false, mug: false, star: false, drawer: false, profile: content.profile });
  const craneClicks = useRef(0);
  const toastTimer = useRef();
  const keyBuffer = useRef([]);
  const orbitRef = useRef({ yaw: 0, pitch: 0, zoom: 0, dragging: false, moved: false, lastX: 0, lastY: 0, pointerX: 0, pointerY: 0 });

  useEffect(() => {
    setEggState((current) => ({ ...current, profile: content.profile }));
  }, [content.profile]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
    return () => { document.body.style.cursor = "default"; };
  }, [hovered]);

  const revealEgg = useCallback((id, message) => {
    if (id === "crane") {
      craneClicks.current += 1;
      if (craneClicks.current < 3) {
        setEggToast(`${message}（${craneClicks.current}/3）`);
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setEggToast(""), 1700);
        return;
      }
    }

    setEggState((current) => ({ ...current, [id]: true, ...(id === "konami" ? { star: true } : {}) }));
    setDiscovered((current) => new Set([...current, id]));
    setEggToast(message);
    if (soundOn) soundBank.reveal.play();
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setEggToast(""), 3000);
  }, [soundOn]);

  const selectSection = useCallback((id) => {
    if (active === id) return;
    setPanelReady(false);
    setActive(id);
    setHovered(null);
    if (soundOn) soundBank.focus.play();
    window.setTimeout(() => setPanelReady(true), reducedMotion ? 40 : 760);
  }, [active, reducedMotion, soundOn]);

  const closeSection = useCallback(() => {
    setPanelReady(false);
    if (soundOn) soundBank.click.play();
    window.setTimeout(() => setActive(null), reducedMotion ? 20 : 180);
  }, [reducedMotion, soundOn]);

  const rotateKnob = useCallback(() => {
    const order = ["intro", "notes", "projects", "work", "about"];
    const currentSection = order[knobStep % order.length];
    const nextStep = knobStep + 1;
    setKnobStep(nextStep);
    selectSection(currentSection);
  }, [knobStep, selectSection]);

  useEffect(() => {
    const konami = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
    const onKey = (event) => {
      if (event.key === "Escape" && active) closeSection();
      const targetTag = event.target?.tagName?.toLowerCase();
      const isTyping = targetTag === "input" || targetTag === "textarea" || event.target?.isContentEditable;
      if (!active && !isTyping) {
        if (event.key === "ArrowLeft") orbitRef.current.yaw = clamp(orbitRef.current.yaw - 0.12, -0.92, 0.92);
        if (event.key === "ArrowRight") orbitRef.current.yaw = clamp(orbitRef.current.yaw + 0.12, -0.92, 0.92);
        if (event.key === "ArrowUp") orbitRef.current.pitch = clamp(orbitRef.current.pitch + 0.1, -0.5, 0.56);
        if (event.key === "ArrowDown") orbitRef.current.pitch = clamp(orbitRef.current.pitch - 0.1, -0.5, 0.56);
        if (event.key === "+" || event.key === "=") orbitRef.current.zoom = clamp(orbitRef.current.zoom + 0.12, -0.35, 1);
        if (event.key === "-" || event.key === "_") orbitRef.current.zoom = clamp(orbitRef.current.zoom - 0.12, -0.35, 1);
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-", "_"].includes(event.key)) event.preventDefault();
      }
      keyBuffer.current = [...keyBuffer.current, event.key.toLowerCase()].slice(-konami.length);
      if (keyBuffer.current.join("|") === konami.join("|")) revealEgg("konami", "DEV MODE：隐藏广播已接通");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, closeSection, revealEgg]);

  const onPointerDown = (event) => {
    if (event.target.closest?.(".world-ui")) return;
    orbitRef.current.dragging = true;
    orbitRef.current.moved = false;
    orbitRef.current.lastX = event.clientX;
    orbitRef.current.lastY = event.clientY;
  };

  const onPointerMove = (event) => {
    const orbit = orbitRef.current;
    orbit.pointerX = event.clientX / window.innerWidth - 0.5;
    orbit.pointerY = event.clientY / window.innerHeight - 0.5;
    if (!orbit.dragging || active) return;
    const deltaX = event.clientX - orbit.lastX;
    const deltaY = event.clientY - orbit.lastY;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) orbit.moved = true;
    orbit.yaw = clamp(orbit.yaw + deltaX * 0.0027, -0.92, 0.92);
    orbit.pitch = clamp(orbit.pitch + deltaY * 0.0022, -0.5, 0.56);
    orbit.lastX = event.clientX;
    orbit.lastY = event.clientY;
  };

  const onPointerUp = () => {
    orbitRef.current.dragging = false;
  };

  const onWheel = (event) => {
    if (active) return;
    event.preventDefault();
    orbitRef.current.zoom = clamp(orbitRef.current.zoom + event.deltaY * 0.0008, -0.35, 1);
  };

  const toggleSound = () => {
    setSoundOn((current) => {
      if (!current) soundBank.click.play();
      return !current;
    });
  };

  return (
    <main
      className={`grand-studio ${active ? "has-focus" : ""} ${eggState.star ? "is-dev-mode" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <Canvas
        className="grand-canvas"
        camera={{ position: VIEW_PRESETS.idle.position, fov: 48, near: 0.1, far: 80 }}
        shadows
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.3;
          gl.shadowMap.type = THREE.PCFShadowMap;
          setLoaded(true);
        }}
      >
        <Suspense fallback={null}>
          <StudioScene
            active={active}
            hovered={hovered}
            orbitRef={orbitRef}
            onHover={setHovered}
            onSelect={selectSection}
            knobStep={knobStep}
            onKnob={rotateKnob}
            eggs={eggState}
            onEgg={revealEgg}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      <header className="world-ui studio-masthead">
        <button type="button" className="masthead-home" onClick={() => active ? closeSection() : selectSection("intro")}>
          <House weight="duotone" aria-hidden="true" />
          <span><strong>DEEP-NIGHT STUDIO</strong><small>PERSONAL ARCHIVE · 2026</small></span>
        </button>
        <div className="masthead-actions">
          <button type="button" onClick={toggleSound} aria-label={soundOn ? "关闭声音" : "开启声音"}>{soundOn ? <SpeakerHigh /> : <SpeakerSlash />}</button>
          <button type="button" onClick={() => navigate("/admin")} aria-label="打开内容管理后台"><GearSix /></button>
        </div>
      </header>

      <WorldHotspots active={active} hovered={hovered} onHover={setHovered} onSelect={selectSection} />
      <button
        type="button"
        className={`world-ui knob-access knob-access--webgl ${active ? "is-hidden" : ""}`}
        onMouseEnter={() => setHovered("knob")}
        onMouseLeave={() => setHovered(null)}
        onClick={rotateKnob}
        aria-label="转动频道旋钮"
        title="转动频道旋钮"
      ><span>旋转频道</span></button>

      <ArchivePanel active={active} ready={panelReady} content={content} discovered={discovered.size} onClose={closeSection} />

      <div className={`world-ui focus-status ${active && !panelReady ? "is-visible" : ""}`} aria-live="polite">
        <i /><span>沿桌面轨迹移动镜头…</span>
      </div>

      <div className="world-ui studio-instruction">
        <span>拖动探索工作台</span><i /> <span>滚轮靠近</span><i /> <span>点击物件进入</span>
      </div>

      <div className="world-ui discovery-counter" title="已发现的彩蛋">
        <span>{String(discovered.size).padStart(2, "0")}</span><i>/ 06</i>
      </div>

      <AnimatePresence>
        {eggToast && (
          <motion.div className="world-ui egg-toast" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}>
            <span>SECRET FOUND</span><strong>{eggToast}</strong>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!loaded && (
          <motion.div className="world-ui studio-loader" exit={{ opacity: 0 }}>
            <div><i /><span>正在点亮工作室…</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
