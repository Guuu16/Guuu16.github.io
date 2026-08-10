import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uHold;
  uniform vec2 uPin;
  uniform vec2 uPointer;

  void main() {
    vUv = uv;
    vec3 p = position;
    vec2 delta = uv - uPin;
    delta.x *= 1.4;
    float distanceToPin = length(delta);
    float influence = exp(-distanceToPin * 5.4) * smoothstep(0.035, 0.14, distanceToPin);
    vec2 direction = normalize(delta + vec2(0.0001));
    float slowBreath = sin(uTime * 0.56 + uv.x * 3.8 + uv.y * 2.1) * 0.0026;
    p.xy += direction * influence * uHold * 0.028;
    p.xy += vec2(uPointer.x, uPointer.y) * influence * 0.012;
    p.z += (slowBreath + sin(uTime * 0.82 + uv.x * 7.0) * 0.0013) * (0.3 + uHold);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uHold;
  uniform float uOpen;
  uniform vec2 uPin;
  uniform vec2 uPointer;
  uniform vec2 uResolution;
  uniform vec2 uImageSize;

  vec2 coverUv(vec2 uv) {
    float screenAspect = uResolution.x / max(uResolution.y, 1.0);
    float imageAspect = uImageSize.x / max(uImageSize.y, 1.0);
    if (screenAspect > imageAspect) {
      uv.y = (uv.y - 0.5) * (imageAspect / screenAspect) + 0.5;
    } else {
      uv.x = (uv.x - 0.5) * (screenAspect / imageAspect) + 0.5;
    }
    return uv;
  }

  void main() {
    vec2 screenUv = vUv;
    vec2 delta = screenUv - uPin;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    delta.x *= aspect;
    float distanceToPin = length(delta);
    float angle = atan(delta.y, delta.x);
    float tensionField = exp(-distanceToPin * 5.0);

    vec2 sampleUv = coverUv(screenUv);
    vec2 rawDelta = screenUv - uPin;
    float rawDistance = length(rawDelta);
    vec2 pullDirection = rawDelta / max(rawDistance, 0.025);
    float anchoredField = tensionField * smoothstep(0.05, 0.18, rawDistance);
    sampleUv += pullDirection * anchoredField * uHold * 0.005;
    sampleUv += vec2(
      sin(uTime * 0.48 + screenUv.y * 8.0),
      cos(uTime * 0.41 + screenUv.x * 7.0)
    ) * (0.00045 + uHold * 0.0012);
    sampleUv += uPointer * anchoredField * 0.0016;

    float radius = uOpen * 1.47;
    float tornEdge =
      sin(angle * 7.0 + uTime * 0.33) * 0.016 +
      sin(angle * 13.0 - uTime * 0.21) * 0.008 +
      sin(angle * 23.0) * 0.0035;
    float openBoundary = radius + tornEdge * smoothstep(0.0, 0.45, uOpen);

    if (uOpen > 0.001 && distanceToPin < openBoundary) discard;

    vec4 color = texture2D(uMap, sampleUv);
    color.rgb = pow(max(color.rgb, vec3(0.0)), vec3(0.52)) * 1.05;
    float compression = smoothstep(0.34, 0.0, distanceToPin) * uHold;
    color.rgb *= 1.0 - compression * 0.095;
    color.rgb += vec3(0.03) * tensionField * uHold;

    float edgeDistance = abs(distanceToPin - openBoundary);
    float edgeLight = (1.0 - smoothstep(0.0, 0.022, edgeDistance)) * smoothstep(0.03, 0.24, uOpen);
    color.rgb = mix(color.rgb, vec3(1.0, 0.055, 0.43), edgeLight * 0.72);
    color.a = 1.0;
    gl_FragColor = color;
  }
`;

function FabricPlane({ image, mobile, holdRef, openRef, pointerRef, onReady }) {
  const texture = useTexture(image);
  const material = useRef(null);
  const { size, viewport } = useThree();
  const pin = mobile ? [0.59, 0.286] : [0.657, 0.456];
  const imageSize = mobile ? [853, 1844] : [1487, 1058];

  const uniforms = useMemo(() => ({
    uMap: { value: texture },
    uTime: { value: 0 },
    uHold: { value: 0 },
    uOpen: { value: 0 },
    uPin: { value: new THREE.Vector2(...pin) },
    uPointer: { value: new THREE.Vector2() },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uImageSize: { value: new THREE.Vector2(...imageSize) },
  }), [imageSize, pin, size.height, size.width, texture]);

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady, texture]);

  useEffect(() => {
    material.current?.uniforms.uResolution.value.set(size.width, size.height);
  }, [size.height, size.width]);

  useFrame((state, delta) => {
    if (!material.current) return;
    const shader = material.current.uniforms;
    shader.uTime.value = state.clock.elapsedTime;
    shader.uHold.value = THREE.MathUtils.damp(shader.uHold.value, holdRef.current, 8.5, delta);
    shader.uOpen.value = THREE.MathUtils.damp(shader.uOpen.value, openRef.current, 6.2, delta);
    shader.uPointer.value.lerp(pointerRef.current, 1 - Math.exp(-5.0 * delta));
  });

  return (
    <mesh scale={[viewport.width / 2, viewport.height / 2, 1]}>
      <planeGeometry args={[2, 2, 96, 64]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function CoverCanvas({ mobile, holdRef, openRef, pointerRef, onReady }) {
  return (
    <Canvas
      className="tension-cover-canvas"
      orthographic
      camera={{ position: [0, 0, 1], zoom: 1 }}
      dpr={[1, 1.45]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
    >
      <FabricPlane
        image={mobile ? "/assets/tension/tension-cover-mobile.png" : "/assets/tension/tension-cover-desktop.png"}
        mobile={mobile}
        holdRef={holdRef}
        openRef={openRef}
        pointerRef={pointerRef}
        onReady={onReady}
      />
    </Canvas>
  );
}
