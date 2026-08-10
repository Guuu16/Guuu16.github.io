import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Howl } from "howler";
import * as THREE from "three";
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

const SECTION_META = {
  intro: { label: "频道中枢", eyebrow: "HOME SIGNAL", icon: Television },
  notes: { label: "笔记管理", eyebrow: "FIELD NOTES", icon: Notebook },
  projects: { label: "项目实验", eyebrow: "PROTOTYPE DECK", icon: Flask },
  work: { label: "工作经历", eyebrow: "CAREER ARCHIVE", icon: Briefcase },
  about: { label: "关于我", eyebrow: "PORTRAIT FILE", icon: UserCircle },
};

const FOCUS_PRESETS = {
  intro: { originX: 51.7, originY: 63.6, scale: 1.34, x: -0.125, y: 0.025 },
  notes: { originX: 23.2, originY: 81.0, scale: 1.52, x: 0.055, y: -0.07 },
  projects: { originX: 57.3, originY: 84.3, scale: 1.48, x: -0.15, y: -0.075 },
  work: { originX: 88.3, originY: 78.2, scale: 1.54, x: -0.025, y: -0.06 },
  about: { originX: 65.6, originY: 74.8, scale: 1.5, x: 0.13, y: -0.045 },
};

const DEPTH_PLANE_HEIGHT = 12.2;
const DEPTH_PLANE_WIDTH = DEPTH_PLANE_HEIGHT * 1.40548;

const soundBank = {
  focus: new Howl({ src: ["/assets/audio/tune.wav"], volume: 0.22 }),
  click: new Howl({ src: ["/assets/audio/click.wav"], volume: 0.2 }),
  reveal: new Howl({ src: ["/assets/audio/power-on.wav"], volume: 0.18 }),
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function damp(current, target, speed, delta) {
  return current + (target - current) * (1 - Math.exp(-speed * delta));
}

const depthVertexShader = `
  varying vec2 vUv;
  uniform sampler2D uDepth;
  uniform float uDepthScale;

  void main() {
    vUv = uv;
    float depthValue = texture2D(uDepth, uv).r;
    vec3 displaced = position;
    displaced.z += smoothstep(0.04, 0.98, depthValue) * uDepthScale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`;

const depthFragmentShader = `
  varying vec2 vUv;
  uniform sampler2D uColor;
  uniform float uStarMode;

  void main() {
    vec4 source = texture2D(uColor, vUv);
    vec3 starTint = vec3(source.r * 0.93, source.g * 1.035, source.b * 1.02);
    gl_FragColor = vec4(mix(source.rgb, starTint, uStarMode), source.a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function DepthCameraRig({ active, orbitRef, reducedMotion }) {
  const { camera } = useThree();
  const currentLook = useRef(new THREE.Vector3(0, 0, 0.35));
  const targetPosition = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const orbit = orbitRef.current;
    const halfFov = THREE.MathUtils.degToRad(camera.fov * 0.5);
    const fitDistance = (DEPTH_PLANE_HEIGHT * 0.5) / Math.tan(halfFov);

    if (active) {
      const preset = FOCUS_PRESETS[active];
      const sceneX = (preset.originX / 100 - 0.5) * DEPTH_PLANE_WIDTH;
      const sceneY = (0.5 - preset.originY / 100) * DEPTH_PLANE_HEIGHT;
      targetPosition.current.set(sceneX * 0.25, sceneY * 0.25, 9.8);
      targetLook.current.set(sceneX * 0.45, sceneY * 0.45, 0.42);
    } else {
      targetPosition.current.set(
        reducedMotion ? 0 : orbit.yaw * 1.08 + orbit.pointerX * 0.18,
        reducedMotion ? 0 : -orbit.pitch * 0.82 - orbit.pointerY * 0.12,
        fitDistance - orbit.zoom * 3.1,
      );
      targetLook.current.set(
        reducedMotion ? 0 : orbit.yaw * 0.045,
        reducedMotion ? 0 : -orbit.pitch * 0.035,
        0.38,
      );
    }

    const speed = reducedMotion ? 28 : active ? 3.25 : orbit.dragging ? 9.5 : 6.2;
    camera.position.lerp(targetPosition.current, 1 - Math.exp(-delta * speed));
    currentLook.current.lerp(targetLook.current, 1 - Math.exp(-delta * speed * 1.08));
    camera.lookAt(currentLook.current);
    camera.updateProjectionMatrix();
    state.gl.toneMappingExposure = 1;
  });

  return null;
}

function DepthArchiveMesh({ starMode, orbitRef, active, onLoaded }) {
  const [colorTexture, depthTexture] = useLoader(THREE.TextureLoader, [
    "/assets/reference/selected-grand-observatory.png",
    "/assets/reference/selected-grand-observatory-depth-v1.png",
  ]);
  const materialRef = useRef();

  useEffect(() => {
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.anisotropy = 8;
    depthTexture.colorSpace = THREE.NoColorSpace;
    depthTexture.minFilter = THREE.LinearFilter;
    depthTexture.magFilter = THREE.LinearFilter;
    colorTexture.needsUpdate = true;
    depthTexture.needsUpdate = true;
    onLoaded();
  }, [colorTexture, depthTexture, onLoaded]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uStarMode.value = damp(materialRef.current.uniforms.uStarMode.value, starMode ? 1 : 0, 3.5, delta);
    const orbit = orbitRef.current;
    const spatialIntent = Math.min(1, Math.abs(orbit.yaw) * 1.3 + Math.abs(orbit.pitch) * 1.2 + orbit.zoom * 0.9);
    const targetDepth = active ? 1.26 : 0.04 + spatialIntent * 1.22;
    materialRef.current.uniforms.uDepthScale.value = damp(materialRef.current.uniforms.uDepthScale.value, targetDepth, active ? 4.2 : 6.5, delta);
  });

  return (
    <mesh>
      <planeGeometry args={[DEPTH_PLANE_WIDTH, DEPTH_PLANE_HEIGHT, 220, 156]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          uColor: { value: colorTexture },
          uDepth: { value: depthTexture },
          uDepthScale: { value: 0.04 },
          uStarMode: { value: starMode ? 1 : 0 },
        }}
        vertexShader={depthVertexShader}
        fragmentShader={depthFragmentShader}
        toneMapped={false}
      />
    </mesh>
  );
}

function PhotoArchiveStage({ active, orbitRef, reducedMotion, starMode, onLoaded }) {
  return (
    <div className={`photo-archive-stage ${active ? `is-focused is-focused--${active}` : ""}`} aria-hidden="true">
      <Canvas
        className="depth-archive-canvas"
        camera={{ position: [0, 0, 13.04], fov: 42, near: 0.1, far: 40 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={["#020504"]} />
        <DepthCameraRig active={active} orbitRef={orbitRef} reducedMotion={reducedMotion} />
        <DepthArchiveMesh starMode={starMode} orbitRef={orbitRef} active={active} onLoaded={onLoaded} />
      </Canvas>
      <div className="photo-archive-noise" />
    </div>
  );
}

function IntroPanel({ profile, discovered }) {
  return (
    <div className="panel-copy intro-copy">
      <p className="panel-lead">{profile.intro}</p>
      <div className="intro-facts">
        <span>拖动观察</span>
        <span>滚轮推进</span>
        <span>点击物件</span>
      </div>
      <p className="panel-note">这个档案站里藏着 {Math.max(0, 6 - discovered)} 个还没有被发现的小秘密。</p>
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
          initial={{ opacity: 0, x: active === "work" || active === "about" ? -28 : 28, scale: 0.985 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: active === "work" || active === "about" ? -18 : 18, scale: 0.99 }}
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
    intro: { left: "51.7%", top: "63.6%", width: "23%", height: "23%" },
    notes: { left: "23.2%", top: "81%", width: "29%", height: "25%" },
    projects: { left: "57.3%", top: "84.3%", width: "22%", height: "20%" },
    work: { left: "88.3%", top: "78.2%", width: "20%", height: "25%" },
    about: { left: "65.6%", top: "74.8%", width: "17%", height: "20%" },
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

function PhotoEggZones({ active, onEgg }) {
  if (active) return null;
  return (
    <div className="world-ui photo-egg-zones" aria-label="隐藏彩蛋区域">
      <button type="button" className="egg-zone egg-zone--clock" aria-label="查看档案墙上的时钟" onClick={() => onEgg("clock", "03:17 — 整座观测站还没有睡")} />
      <button type="button" className="egg-zone egg-zone--star" aria-label="查看时钟旁的星灯" onClick={() => onEgg("star", "城市灯光短暂连成了一张星图")} />
      <button type="button" className="egg-zone egg-zone--mug" aria-label="查看咖啡杯" onClick={() => onEgg("mug", "杯底藏着另一个值夜班的我")} />
      <button type="button" className="egg-zone egg-zone--lamp" aria-label="查看工作台灯" onClick={() => onEgg("lamp", "台灯照亮了一条还没写完的线索")} />
      <button type="button" className="egg-zone egg-zone--drawer" aria-label="查看桌下打开的抽屉" onClick={() => onEgg("drawer", "抽屉里的 NO.23 还没有完成")} />
    </div>
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
  const toastTimer = useRef();
  const keyBuffer = useRef([]);
  const orbitRef = useRef({ yaw: 0, pitch: 0, zoom: 0, dragging: false, moved: false, lastX: 0, lastY: 0, pointerX: 0, pointerY: 0 });

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "default";
    return () => { document.body.style.cursor = "default"; };
  }, [hovered]);

  const revealEgg = useCallback((id, message) => {
    setDiscovered((current) => new Set([...current, id]));
    setEggToast(message);
    if (soundOn) soundBank.reveal.play();
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setEggToast(""), 2700);
  }, [soundOn]);

  const selectSection = useCallback((id) => {
    if (active === id) return;
    setPanelReady(false);
    setActive(id);
    setHovered(null);
    if (soundOn) soundBank.focus.play();
    window.setTimeout(() => setPanelReady(true), reducedMotion ? 30 : 680);
  }, [active, reducedMotion, soundOn]);

  const closeSection = useCallback(() => {
    setPanelReady(false);
    if (soundOn) soundBank.click.play();
    window.setTimeout(() => setActive(null), reducedMotion ? 20 : 160);
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
        if (event.key === "ArrowLeft") orbitRef.current.yaw = clamp(orbitRef.current.yaw - 0.12, -1, 1);
        if (event.key === "ArrowRight") orbitRef.current.yaw = clamp(orbitRef.current.yaw + 0.12, -1, 1);
        if (event.key === "ArrowUp") orbitRef.current.pitch = clamp(orbitRef.current.pitch - 0.1, -1, 1);
        if (event.key === "ArrowDown") orbitRef.current.pitch = clamp(orbitRef.current.pitch + 0.1, -1, 1);
        if (event.key === "+" || event.key === "=") orbitRef.current.zoom = clamp(orbitRef.current.zoom + 0.12, 0, 1);
        if (event.key === "-" || event.key === "_") orbitRef.current.zoom = clamp(orbitRef.current.zoom - 0.12, 0, 1);
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
    orbit.yaw = clamp(orbit.yaw + deltaX * 0.0045, -1, 1);
    orbit.pitch = clamp(orbit.pitch + deltaY * 0.004, -1, 1);
    orbit.lastX = event.clientX;
    orbit.lastY = event.clientY;
  };

  const onPointerUp = () => { orbitRef.current.dragging = false; };

  const onWheel = (event) => {
    if (active) return;
    event.preventDefault();
    orbitRef.current.zoom = clamp(orbitRef.current.zoom + event.deltaY * 0.001, 0, 1);
  };

  const toggleSound = () => {
    setSoundOn((current) => {
      if (!current) soundBank.click.play();
      return !current;
    });
  };

  return (
    <main
      className={`grand-studio photo-observatory ${active ? "has-focus" : ""} ${discovered.has("star") ? "is-dev-mode" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <div className="photo-archive-frame">
        <PhotoArchiveStage active={active} orbitRef={orbitRef} reducedMotion={reducedMotion} starMode={discovered.has("star")} onLoaded={() => setLoaded(true)} />
        <WorldHotspots active={active} hovered={hovered} onHover={setHovered} onSelect={selectSection} />
        <PhotoEggZones active={active} onEgg={revealEgg} />
        <button
          type="button"
          className={`world-ui knob-access knob-access--photo ${active ? "is-hidden" : ""}`}
          onMouseEnter={() => setHovered("knob")}
          onMouseLeave={() => setHovered(null)}
          onClick={rotateKnob}
          aria-label="转动频道旋钮"
          title="转动频道旋钮"
        ><span>旋转频道</span></button>
      </div>

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

      <ArchivePanel active={active} ready={panelReady} content={content} discovered={discovered.size} onClose={closeSection} />

      <div className={`world-ui focus-status ${active && !panelReady ? "is-visible" : ""}`} aria-live="polite">
        <i /><span>沿桌面轨迹移动镜头…</span>
      </div>

      <div className="world-ui studio-instruction">
        <span>拖动观察</span><i /> <span>滚轮推进</span><i /> <span>点击物件进入</span>
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
            <div><i /><span>正在点亮档案观测站…</span></div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
