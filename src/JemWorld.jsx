import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import condensedFontUrl from "@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff";
import monoFontUrl from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff";

export const ZONES = [
  {
    id: "work",
    number: "01",
    label: "WORK",
    caption: "SELECTED PROJECTS",
    position: [1.1, 1.6, -7.4],
    rotation: [0, -0.18, 0.035],
    size: [2.25, 5.75],
  },
  {
    id: "notes",
    number: "02",
    label: "NOTES",
    caption: "THOUGHTS / RESEARCH",
    position: [6.25, 4.25, -13.4],
    rotation: [0, -0.1, 0.01],
    size: [2.05, 5.9],
  },
  {
    id: "about",
    number: "03",
    label: "ABOUT",
    caption: "PHILOSOPHY / EXPERIENCE",
    position: [10.5, 1.8, -19.3],
    rotation: [0, -0.06, -0.018],
    size: [1.85, 5.65],
  },
  {
    id: "contact",
    number: "04",
    label: "CONTACT",
    caption: "OPEN FOR COLLABORATION",
    position: [14.3, -0.2, -24.7],
    rotation: [0, -0.02, -0.025],
    size: [1.75, 5.45],
  },
];

const CAMERA_PRESETS = {
  home: { position: [-0.8, 2.2, 17.8], target: [3.9, 1.25, -15], fov: 43 },
  entered: { position: [-1.25, 2.55, 22.25], target: [2.55, 0.95, -15.3], fov: 43 },
  work: { position: [-2.55, 2.35, -0.25], target: [1.1, 1.55, -7.5], fov: 39 },
  notes: { position: [2.15, 4.55, -6.0], target: [6.2, 4.0, -13.45], fov: 39 },
  about: { position: [6.45, 2.65, -11.6], target: [10.45, 1.7, -19.35], fov: 38.5 },
  contact: { position: [10.35, 0.85, -17.0], target: [14.2, -0.15, -24.8], fov: 38 },
};

function CameraRig({ activeZone, entered, inputRef, reducedMotion }) {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(...CAMERA_PRESETS.home.target));
  const transitionRef = useRef({
    key: "home",
    elapsed: 1,
    startPosition: new THREE.Vector3(...CAMERA_PRESETS.home.position),
    startTarget: new THREE.Vector3(...CAMERA_PRESETS.home.target),
    controlPosition: new THREE.Vector3(...CAMERA_PRESETS.home.position),
    startFov: CAMERA_PRESETS.home.fov,
  });
  const desiredPosition = useMemo(() => new THREE.Vector3(), []);
  const desiredTarget = useMemo(() => new THREE.Vector3(), []);
  const offset = useMemo(() => new THREE.Vector3(), []);
  const spherical = useMemo(() => new THREE.Spherical(), []);
  const flightPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const key = activeZone === "home" ? (entered ? "entered" : "home") : activeZone;
    const preset = CAMERA_PRESETS[key] || CAMERA_PRESETS.home;
    desiredTarget.fromArray(preset.target);
    offset.fromArray(preset.position).sub(desiredTarget);
    spherical.setFromVector3(offset);

    const input = inputRef.current;
    const orbitScale = activeZone === "home" ? 1 : 0.44;
    spherical.theta += input.yaw * orbitScale;
    spherical.phi += input.pitch * orbitScale;
    spherical.radius = Math.max(5.4, spherical.radius + input.dolly);
    spherical.makeSafe();

    desiredPosition.setFromSpherical(spherical).add(desiredTarget);
    const transition = transitionRef.current;
    if (transition.key !== key) {
      transition.key = key;
      transition.elapsed = 0;
      transition.startPosition.copy(camera.position);
      transition.startTarget.copy(currentTarget.current);
      transition.startFov = camera.fov;
      transition.controlPosition.copy(camera.position).lerp(desiredPosition, 0.5);
      transition.controlPosition.y += key === "entered" ? 2.2 : 1.25;
      transition.controlPosition.x += desiredPosition.x >= camera.position.x ? -0.7 : 0.7;
    }

    const duration = reducedMotion ? 0.06 : key === "entered" ? 1.12 : key === "home" ? 1.16 : 1.24;
    if (transition.elapsed < duration) {
      transition.elapsed = Math.min(duration, transition.elapsed + delta);
      const progress = transition.elapsed / duration;
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const inverse = 1 - eased;
      flightPosition
        .copy(transition.startPosition)
        .multiplyScalar(inverse * inverse)
        .addScaledVector(transition.controlPosition, 2 * inverse * eased)
        .addScaledVector(desiredPosition, eased * eased);
      camera.position.copy(flightPosition);
      currentTarget.current.lerpVectors(transition.startTarget, desiredTarget, eased);
      camera.fov = THREE.MathUtils.lerp(transition.startFov, preset.fov, eased) + Math.sin(Math.PI * progress) * 2.6;
      camera.updateProjectionMatrix();
    } else {
      const alpha = 1 - Math.exp(-(reducedMotion ? 24 : 8.5) * delta);
      camera.position.lerp(desiredPosition, alpha);
      currentTarget.current.lerp(desiredTarget, alpha);
      camera.fov = THREE.MathUtils.damp(camera.fov, preset.fov, 7, delta);
      camera.updateProjectionMatrix();
    }
    camera.lookAt(currentTarget.current);
  });

  return null;
}

function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const generator = new THREE.PMREMGenerator(gl);
    const environmentScene = new RoomEnvironment();
    const environment = generator.fromScene(environmentScene, 0.035).texture;
    scene.environment = environment;
    return () => {
      scene.environment = null;
      environment.dispose();
      environmentScene.dispose();
      generator.dispose();
    };
  }, [gl, scene]);

  return null;
}

function FrameScheduler({ reducedMotion, inputRef }) {
  const { invalidate } = useThree();

  useEffect(() => {
    let timer = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const visible = document.visibilityState === "visible";
      const focused = document.hasFocus();
      const interacting = performance.now() < (inputRef.current.activeUntil || 0);
      if (visible) invalidate();
      const delay = !visible ? 500 : !focused ? 120 : reducedMotion ? 150 : interacting ? 16 : 34;
      timer = window.setTimeout(tick, delay);
    };
    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputRef, invalidate, reducedMotion]);

  return null;
}

function StarField() {
  const pointsRef = useRef(null);
  const positions = useMemo(() => {
    const count = 980;
    const values = new Float32Array(count * 3);
    let seed = 417;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < values.length; index += 3) {
      values[index] = -20 + random() * 52;
      values[index + 1] = -8 + random() * 27;
      values[index + 2] = 4 - random() * 70;
    }
    return values;
  }, []);

  useFrame((_, delta) => {
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.0018;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#e9e9e6" size={0.028} transparent opacity={0.48} depthWrite={false} />
    </points>
  );
}

function LightRing() {
  return (
    <group position={[4.1, 5.6, -14.8]} rotation={[0.015, -0.08, 0]}>
      <mesh>
        <torusGeometry args={[5.45, 0.085, 10, 160]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[5.47, 0.18, 8, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[5.49, 0.34, 8, 160]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.055} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

function HorizonBeam() {
  return (
    <group position={[4, -0.15, -18]}>
      <mesh>
        <boxGeometry args={[52, 0.035, 0.035]} />
        <meshBasicMaterial color="#ff2f92" toneMapped={false} />
      </mesh>
      <mesh>
        <boxGeometry args={[52, 0.16, 0.08]} />
        <meshBasicMaterial color="#ff2f92" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      {[-8, 3, 13].map((x) => (
        <pointLight key={x} position={[x, 0, 0.8]} color="#ff2f92" intensity={5.5} distance={11} decay={2} />
      ))}
    </group>
  );
}

function CityField({ facadeTexture }) {
  const buildings = useMemo(() => {
    let seed = 1603;
    const random = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return Array.from({ length: 88 }, (_, index) => {
      const depth = -9 - random() * 54;
      const height = 5 + random() * 24;
      const x = -13 + random() * 43;
      const width = 0.42 + random() * 1.38;
      return {
        position: [x, -3.15 - height * 0.5 + random() * 1.8, depth],
        scale: [width, height, 0.6 + random() * 1.45],
        edge: index % 7 === 0,
      };
    });
  }, []);

  return (
    <group>
      {buildings.map((building, index) => (
        <mesh key={`city-${index}`} position={building.position} scale={building.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={building.edge ? "#303136" : "#15161a"}
            map={facadeTexture}
            metalness={0.6}
            roughness={0.44}
            emissive="#090a0d"
            emissiveMap={facadeTexture}
            emissiveIntensity={0.72}
          />
          {building.edge && <Edges color="#5f6165" threshold={18} />}
        </mesh>
      ))}
    </group>
  );
}

function Walkway({ start, end, texture, width = 2.25 }) {
  const transform = useMemo(() => {
    const from = new THREE.Vector3(...start);
    const to = new THREE.Vector3(...end);
    const direction = to.clone().sub(from);
    const midpoint = from.clone().add(to).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction.clone().normalize());
    return { midpoint, quaternion, length: direction.length() };
  }, [end, start]);
  const posts = useMemo(() => {
    const count = Math.max(3, Math.round(transform.length / 1.8));
    return Array.from({ length: count }, (_, index) => (
      -transform.length / 2 + (index / Math.max(1, count - 1)) * transform.length
    ));
  }, [transform.length]);

  return (
    <group position={transform.midpoint} quaternion={transform.quaternion}>
      <mesh>
        <boxGeometry args={[width, 0.22, transform.length]} />
        <meshStandardMaterial color="#252629" map={texture} metalness={0.72} roughness={0.19} envMapIntensity={2.8} />
      </mesh>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[width * 0.86, 0.1, transform.length * 0.98]} />
        <meshStandardMaterial color="#030304" metalness={0.78} roughness={0.2} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 - 0.06), 0.53, 0]}>
          <mesh>
            <boxGeometry args={[0.045, 0.045, transform.length]} />
            <meshStandardMaterial color="#8b8c8e" metalness={0.96} roughness={0.14} />
          </mesh>
          {posts.map((z) => (
            <mesh key={z} position={[0, -0.28, z]}>
              <boxGeometry args={[0.04, 0.58, 0.04]} />
              <meshStandardMaterial color="#414246" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.045, 0.025, transform.length * 0.94]} />
        <meshBasicMaterial color="#f3f3ef" transparent opacity={0.72} toneMapped={false} />
      </mesh>
    </group>
  );
}

function JemMonolith({ concreteTexture }) {
  const depth = useMemo(() => Array.from({ length: 3 }, (_, index) => ({
    z: 0.72 - index * 0.045,
    x: -index * 0.008,
    y: -index * 0.008,
    color: "#171719",
  })), []);

  return (
    <group position={[-5.65, 1.15, -4.0]} rotation={[0, 0.12, 0]} scale={1.16}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[6.9, 8.8, 1.15]} />
        <meshStandardMaterial color="#343538" map={concreteTexture} metalness={0.08} roughness={0.86} envMapIntensity={0.9} />
        <Edges color="#2d2d30" threshold={22} />
      </mesh>
      {depth.map((layer, index) => (
        <Text
          key={`jem-depth-${index}`}
          position={[-2.95 + layer.x, -3.3 + layer.y, layer.z]}
          font={condensedFontUrl}
          fontSize={5.7}
          letterSpacing={-0.09}
          anchorX="left"
          anchorY="bottom"
          color={layer.color}
        >
          JEM
        </Text>
      ))}
      <Text
        position={[-2.95, -3.3, 0.82]}
        font={condensedFontUrl}
        fontSize={5.7}
        letterSpacing={-0.09}
        anchorX="left"
        anchorY="bottom"
        color="#eeeeeb"
      >
        JEM
      </Text>
      <Text
        position={[-2.75, -3.88, 0.84]}
        font={condensedFontUrl}
        fontSize={0.48}
        letterSpacing={0.34}
        anchorX="left"
        anchorY="middle"
        color="#efefec"
      >
        TEST DEVELOPMENT ENGINEER
      </Text>
      <mesh position={[0, -4.55, 0.7]}>
        <boxGeometry args={[6.72, 0.035, 0.035]} />
        <meshBasicMaterial color="#ff2f92" toneMapped={false} />
      </mesh>
    </group>
  );
}

function VerticalLabel({ label, height }) {
  return (
    <Text
      position={[0, 0.1, 0.245]}
      font={condensedFontUrl}
      fontSize={0.74}
      lineHeight={0.72}
      letterSpacing={0.01}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      color="#eeeeeb"
      maxWidth={height * 0.7}
    >
      {label.split("").join("\n")}
    </Text>
  );
}

function NavigationTower({ zone, active, concreteTexture, onSelect }) {
  const groupRef = useRef(null);
  const leftShutterRef = useRef(null);
  const rightShutterRef = useRef(null);
  const innerRef = useRef(null);
  const labelRef = useRef(null);
  const lightRef = useRef(null);
  const hoverRef = useRef(false);
  const scaleRef = useRef(1);
  const openRef = useRef(0);
  const [width, height] = zone.size;
  const dataBars = useMemo(() => Array.from({ length: 7 }, (_, index) => ({
    y: height * 0.27 - index * height * 0.085,
    width: width * (0.22 + ((index * 37) % 5) * 0.09),
  })), [height, width]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = hoverRef.current || active ? 1.025 : 1;
    scaleRef.current = THREE.MathUtils.damp(scaleRef.current, target, 8, delta);
    groupRef.current.scale.setScalar(scaleRef.current);
    openRef.current = THREE.MathUtils.damp(openRef.current, active ? 1 : 0, active ? 4.4 : 5.8, delta);
    const open = openRef.current;

    if (leftShutterRef.current && rightShutterRef.current) {
      leftShutterRef.current.position.x = -width * 0.255 - open * width * 0.235;
      rightShutterRef.current.position.x = width * 0.255 + open * width * 0.235;
      leftShutterRef.current.position.z = 0.29 + open * 0.16;
      rightShutterRef.current.position.z = 0.29 + open * 0.16;
      leftShutterRef.current.rotation.y = -open * 0.24;
      rightShutterRef.current.rotation.y = open * 0.24;
    }
    if (innerRef.current) {
      innerRef.current.scale.y = 0.74 + open * 0.26;
      innerRef.current.position.z = 0.17 + open * 0.12;
    }
    if (labelRef.current) {
      labelRef.current.position.z = 0.43 + open * 0.18;
      labelRef.current.position.y = open * 0.08;
    }
    if (lightRef.current) lightRef.current.intensity = 3.2 + open * 8.8;
  });

  return (
    <group
      ref={groupRef}
      position={zone.position}
      rotation={zone.rotation}
      onClick={(event) => { event.stopPropagation(); onSelect(zone.id); }}
      onPointerOver={(event) => {
        event.stopPropagation();
        hoverRef.current = true;
        document.body.dataset.worldHover = "true";
      }}
      onPointerOut={() => {
        hoverRef.current = false;
        delete document.body.dataset.worldHover;
      }}
    >
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[width, height, 0.5]} />
        <meshStandardMaterial
          color="#15161a"
          map={concreteTexture}
          metalness={0.42}
          roughness={0.58}
          envMapIntensity={1.55}
        />
        <Edges color={active ? "#ff2f92" : "#58595d"} threshold={16} />
      </mesh>

      <group ref={innerRef} position={[0, 0, 0.17]}>
        <mesh>
          <boxGeometry args={[width * 0.78, height * 0.83, 0.045]} />
          <meshPhysicalMaterial
            color="#09090c"
            metalness={0.74}
            roughness={0.2}
            transparent
            opacity={0.94}
            emissive="#ff2f92"
            emissiveIntensity={active ? 0.16 : 0.015}
            envMapIntensity={2.2}
          />
          <Edges color={active ? "#ff2f92" : "#3d3e42"} threshold={18} />
        </mesh>
        {dataBars.map((bar, index) => (
          <mesh key={`${zone.id}-bar-${index}`} position={[-width * 0.22 + bar.width * 0.5, bar.y, 0.04]}>
            <boxGeometry args={[bar.width, 0.018, 0.012]} />
            <meshBasicMaterial color={index === 0 || index === 5 ? "#ff2f92" : "#d7d7d3"} transparent opacity={active ? 0.78 : 0.08} toneMapped={false} />
          </mesh>
        ))}
        <Text
          position={[-width * 0.29, -height * 0.31, 0.05]}
          font={monoFontUrl}
          fontSize={0.115}
          letterSpacing={0.14}
          anchorX="left"
          anchorY="middle"
          color={active ? "#ff78b7" : "#69696d"}
        >
          ACCESS / {zone.number}
        </Text>
      </group>

      <mesh ref={leftShutterRef} position={[-width * 0.255, 0, 0.29]}>
        <boxGeometry args={[width * 0.49, height * 0.985, 0.14]} />
        <meshStandardMaterial
          color="#292a2d"
          map={concreteTexture}
          metalness={0.28}
          roughness={0.72}
          envMapIntensity={1.25}
        />
        <Edges color={active ? "#8b385f" : "#77787b"} threshold={16} />
      </mesh>
      <mesh ref={rightShutterRef} position={[width * 0.255, 0, 0.29]}>
        <boxGeometry args={[width * 0.49, height * 0.985, 0.14]} />
        <meshStandardMaterial
          color="#242529"
          map={concreteTexture}
          metalness={0.3}
          roughness={0.7}
          envMapIntensity={1.25}
        />
        <Edges color={active ? "#8b385f" : "#77787b"} threshold={16} />
      </mesh>

      {[-1, 1].map((side) => (
        <group key={`rail-${side}`} position={[side * (width / 2 + 0.055), 0, 0.04]}>
          <mesh>
            <boxGeometry args={[0.07, height * 1.035, 0.18]} />
            <meshStandardMaterial color="#111215" metalness={0.88} roughness={0.22} />
          </mesh>
          {[-0.34, 0.34].map((yFactor) => (
            <mesh key={yFactor} position={[0, height * yFactor, 0.115]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.035, 12]} />
              <meshStandardMaterial color="#a5a6a8" metalness={1} roughness={0.18} />
            </mesh>
          ))}
        </group>
      ))}

      <group ref={labelRef} position={[0, 0, 0.43]}>
        <Text
          position={[-width / 2 + 0.22, height / 2 - 0.25, 0]}
          font={monoFontUrl}
          fontSize={0.19}
          anchorX="left"
          anchorY="top"
          color="#f2f2ef"
        >
          {zone.number}
        </Text>
        <VerticalLabel label={zone.label} height={height} />
        <Text
          position={[0.2, -height / 2 + 0.4, 0.005]}
          font={monoFontUrl}
          fontSize={0.34}
          anchorX="center"
          anchorY="middle"
          color="#f3f3ef"
        >
          →
        </Text>
      </group>

      <group position={[0, -height / 2 - 0.58, 0]}>
        <mesh>
          <boxGeometry args={[width * 2.2, 0.42, 2.6]} />
          <meshStandardMaterial color="#060607" metalness={0.62} roughness={0.36} envMapIntensity={1.8} />
          <Edges color="#4a4a4d" threshold={20} />
        </mesh>
        <mesh position={[0, -0.27, 0]}>
          <boxGeometry args={[width * 1.65, 0.18, 1.6]} />
          <meshBasicMaterial color="#ff2f92" transparent opacity={active ? 0.95 : 0.42} toneMapped={false} />
        </mesh>
        {[-0.72, 0, 0.72].map((xFactor) => (
          <mesh key={xFactor} position={[xFactor * width, 0.24, 1.12]}>
            <boxGeometry args={[0.055, 0.06, 0.52]} />
            <meshBasicMaterial color={active ? "#ff2f92" : "#9b9b9f"} toneMapped={false} />
          </mesh>
        ))}
        <pointLight ref={lightRef} position={[0, -0.35, 0.3]} color="#ff2f92" intensity={3.2} distance={7.5} decay={2} />
      </group>
    </group>
  );
}

function MonolithCity({ activeZone, onSelect }) {
  const [concreteTexture, walkwayTexture, facadeTexture] = useTexture([
    "/assets/world/monolith-concrete.png",
    "/assets/world/monolith-wet-walkway.png",
    "/assets/world/monolith-city-facade.png",
  ]);

  useEffect(() => {
    const configs = [
      [concreteTexture, 1.35, 2.25],
      [walkwayTexture, 1.7, 4.2],
      [facadeTexture, 1.1, 2.6],
    ];
    configs.forEach(([texture, repeatX, repeatY]) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(repeatX, repeatY);
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    });
  }, [concreteTexture, facadeTexture, walkwayTexture]);

  return (
    <group>
      <StarField />
      <CityField facadeTexture={facadeTexture} />
      <HorizonBeam />
      <LightRing />
      <JemMonolith concreteTexture={concreteTexture} />
      <Walkway start={[-8.6, -2.8, 5.5]} end={[-1.2, -1.05, -3.2]} texture={walkwayTexture} width={2.8} />
      <Walkway start={[-1.2, -1.05, -3.2]} end={[1.1, -0.9, -7.0]} texture={walkwayTexture} width={2.5} />
      <Walkway start={[1.1, -0.9, -7.0]} end={[5.8, 0.25, -13.0]} texture={walkwayTexture} width={1.95} />
      <Walkway start={[5.8, 0.25, -13.0]} end={[10.2, -0.15, -18.8]} texture={walkwayTexture} width={1.65} />
      <Walkway start={[10.2, -0.15, -18.8]} end={[14.0, -1.7, -24.3]} texture={walkwayTexture} width={1.4} />
      {ZONES.map((zone) => (
        <NavigationTower
          key={zone.id}
          zone={zone}
          active={activeZone === zone.id}
          concreteTexture={concreteTexture}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

function Scene({ activeZone, entered, inputRef, onSelect, reducedMotion }) {
  return (
    <>
      <color attach="background" args={["#030405"]} />
      <fog attach="fog" args={["#05060a", 28, 76]} />
      <ambientLight intensity={0.055} />
      <hemisphereLight args={["#b8bdc7", "#010102", 0.12]} />
      <directionalLight position={[-8, 12, 9]} intensity={0.82} color="#f5f5f2" />
      <directionalLight position={[12, 5, 2]} intensity={0.28} color="#b9bcc2" />
      <spotLight position={[-3, 10, 8]} angle={0.38} penumbra={0.92} intensity={23} color="#ffffff" />
      <pointLight position={[5, -1, -11]} intensity={4.6} distance={18} color="#ff2f92" decay={2} />

      <FrameScheduler reducedMotion={reducedMotion} inputRef={inputRef} />
      <CameraRig activeZone={activeZone} entered={entered} inputRef={inputRef} reducedMotion={reducedMotion} />
      <StudioEnvironment />
      <MonolithCity activeZone={activeZone} onSelect={onSelect} />
    </>
  );
}

export function JemWorld({ activeZone, entered, inputRef, onSelect, reducedMotion }) {
  useEffect(() => () => { delete document.body.dataset.worldHover; }, []);

  return (
    <Canvas
      className="jem-canvas"
      camera={{ position: CAMERA_PRESETS.home.position, fov: 43, near: 0.1, far: 120 }}
      dpr={1}
      frameloop="demand"
      gl={{ antialias: true, alpha: false, stencil: false, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
      }}
    >
      <Suspense fallback={null}>
        <Scene
          activeZone={activeZone}
          entered={entered}
          inputRef={inputRef}
          onSelect={onSelect}
          reducedMotion={reducedMotion}
        />
      </Suspense>
    </Canvas>
  );
}
