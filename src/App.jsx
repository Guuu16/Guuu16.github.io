import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Check,
  Database,
  DownloadSimple,
  EnvelopeSimple,
  GearSix,
  GraduationCap,
  House,
  MagnifyingGlass,
  Notebook,
  Plus,
  SpeakerHigh,
  SpeakerSlash,
  Trash,
  UploadSimple,
  User,
  X,
} from "@phosphor-icons/react";
import { JemWorld, ZONES } from "./JemWorld";
import { TensionPortfolio } from "./TensionPortfolio";
import {
  createId,
  LANGUAGE_KEY,
  localize,
  sanitizeImportedContent,
  updateLocalizedValue,
  useContentStore,
} from "./content";
import { getCopy } from "./i18n";
import { getReturnMode, getZoneSelectionMode, MOTION_TIMINGS } from "./scene-transitions";

const NAVIGATION = [
  { id: "work", number: "01" },
  { id: "notes", number: "02" },
  { id: "about", number: "03" },
  { id: "contact", number: "04" },
];

const LOCAL_ADMIN_ENABLED = import.meta.env.DEV;

function LanguageSwitcher({ language, onChange, className = "" }) {
  const copy = getCopy(language);
  const nextLanguage = language === "zh" ? "en" : "zh";
  return (
    <div className={`language-switcher ${className}`.trim()} aria-label={copy.switchLanguage}>
      <button
        type="button"
        className={language === "zh" ? "is-active" : ""}
        onClick={() => onChange("zh")}
        aria-pressed={language === "zh"}
      >
        中
      </button>
      <i aria-hidden="true" />
      <button
        type="button"
        className={language === "en" ? "is-active" : ""}
        onClick={() => onChange("en")}
        aria-pressed={language === "en"}
      >
        EN
      </button>
      <span className="sr-only">{nextLanguage === "zh" ? "中文" : "English"}</span>
    </div>
  );
}

function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((path) => {
    window.history.pushState({}, "", path);
    setPathname(path);
    window.scrollTo(0, 0);
  }, []);

  return [pathname, navigate];
}

function useAmbientSound() {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef(null);

  const toggle = useCallback(async () => {
    if (enabled) {
      audioRef.current?.close?.();
      audioRef.current = null;
      setEnabled(false);
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const low = context.createOscillator();
    const shimmer = context.createOscillator();
    master.gain.value = 0.025;
    filter.type = "lowpass";
    filter.frequency.value = 210;
    low.frequency.value = 43;
    shimmer.frequency.value = 86.4;
    low.type = "sine";
    shimmer.type = "triangle";
    low.connect(filter);
    shimmer.connect(filter);
    filter.connect(master);
    master.connect(context.destination);
    low.start();
    shimmer.start();
    audioRef.current = context;
    setEnabled(true);
  }, [enabled]);

  useEffect(() => () => audioRef.current?.close?.(), []);
  return { enabled, toggle };
}

function IntroSequence({ onComplete, reducedMotion, copy }) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, reducedMotion ? 120 : 850);
    return () => window.clearTimeout(timer);
  }, [onComplete, reducedMotion]);

  return (
    <motion.div className="intro-sequence" exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.1 : 0.3 }}>
      <div className="intro-brand">
        <span>JEM</span>
        <i />
      </div>
      <div className="intro-readout">
        <span>{copy.spatialArchive}</span>
        <strong>00 → 100</strong>
      </div>
      <motion.div
        className="intro-rule"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: reducedMotion ? 0.1 : 0.72, ease: [0.2, 0.8, 0.2, 1] }}
      />
    </motion.div>
  );
}

function WorkPanel({ content, language, copy }) {
  const experiences = content.experiences.filter((item) => item.published);
  const projects = content.projects.filter((item) => item.published);
  const [view, setView] = useState("experience");
  const items = view === "experience" ? experiences : projects;
  const [activeId, setActiveId] = useState(items[0]?.id);

  const switchView = (nextView) => {
    if (nextView === view) return;
    const nextItems = nextView === "experience" ? experiences : projects;
    setView(nextView);
    setActiveId(nextItems[0]?.id);
  };

  const active = items.find((item) => item.id === activeId) || items[0];

  return (
    <div className="chapter-body work-chapter">
      <div className="chapter-switch" role="tablist" aria-label={copy.workView}>
        <button type="button" role="tab" aria-selected={view === "experience"} onClick={() => switchView("experience")}>{copy.experience}</button>
        <button type="button" role="tab" aria-selected={view === "projects"} onClick={() => switchView("projects")}>{copy.projects}</button>
      </div>
      <div className="work-index" aria-label={view === "experience" ? copy.experienceList : copy.projectList}>
        {items.map((item, index) => (
          <button key={item.id} type="button" className={active?.id === item.id ? "is-active" : ""} onClick={() => setActiveId(item.id)}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{localize(item.company || item.title, language)}</strong>
            <small>{localize(item.period || item.kicker, language)}</small>
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {active ? (
          <motion.article
            key={active.id}
            className="work-detail"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <span>{localize(active.period || active.kicker, language)}</span>
            <h3>{localize(active.role || active.title, language)}</h3>
            {active.company && <h4>{localize(active.company, language)}</h4>}
            <p>{localize(active.summary, language)}</p>
            {localize(active.highlights, language)?.length > 0 && (
              <ul className="work-highlights">
                {localize(active.highlights, language).map((highlight) => <li key={highlight}>{highlight}</li>)}
              </ul>
            )}
            <div className="skill-row">
              {(localize(active.skills || active.tech, language) || []).map((item) => <span key={item}>{item}</span>)}
            </div>
            {active.url && (
              <a href={active.url} target="_blank" rel="noreferrer">{copy.openProject} <ArrowUpRight weight="bold" /></a>
            )}
          </motion.article>
        ) : <p className="chapter-empty">{copy.noPublished}</p>}
      </AnimatePresence>
    </div>
  );
}

function NotesPanel({ notes, language, copy }) {
  const published = notes.filter((item) => item.published);
  const [query, setQuery] = useState("");
  const filtered = published.filter((item) => `${localize(item.title, language)} ${localize(item.excerpt, language)} ${localize(item.tag, language)}`.toLowerCase().includes(query.toLowerCase()));
  const [activeId, setActiveId] = useState(published[0]?.id);
  const active = filtered.find((item) => item.id === activeId) || filtered[0];

  return (
    <div className="chapter-body notes-chapter">
      <label className="note-search">
        <MagnifyingGlass weight="bold" aria-hidden="true" />
        <span className="sr-only">{copy.searchNotes}</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} />
      </label>
      <div className="note-index">
        {filtered.map((item) => (
          <button key={item.id} type="button" className={active?.id === item.id ? "is-active" : ""} onClick={() => setActiveId(item.id)}>
            <span>{item.date}</span>
            <strong>{localize(item.title, language)}</strong>
            <small>{localize(item.tag, language)}</small>
          </button>
        ))}
        {!filtered.length && <p className="chapter-empty">{copy.noSignals}</p>}
      </div>
      <AnimatePresence mode="wait">
        {active && (
          <motion.article
            key={active.id}
            className="note-reader"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 0.8, 0.2, 1] }}
          >
            <span>{localize(active.tag, language)} / {active.date}</span>
            <h3>{localize(active.title, language)}</h3>
            <p className="note-lead">{localize(active.excerpt, language)}</p>
            <p>{localize(active.content, language)}</p>
          </motion.article>
        )}
      </AnimatePresence>
    </div>
  );
}

function AboutPanel({ profile, education, language, copy }) {
  const publishedEducation = education.filter((item) => item.published);
  return (
    <div className="chapter-body about-chapter">
      <p className="about-intro">{localize(profile.intro, language)}</p>
      <div className="about-grid">
        <div><span>{copy.focus}</span><strong>{localize(profile.focus, language)}</strong></div>
        <div><span>{copy.medium}</span><strong>{localize(profile.medium, language)}</strong></div>
        <div><span>{copy.location}</span><strong>{localize(profile.location, language)}</strong></div>
        <div><span>{copy.status}</span><strong>{localize(profile.availability, language)}</strong></div>
      </div>
      <section className="education-block">
        <span>{copy.education}</span>
        {publishedEducation.map((item) => (
          <article key={item.id}>
            <small>{localize(item.period, language)}</small>
            <strong>{localize(item.school, language)}</strong>
            <p>{localize(item.degree, language)}</p>
          </article>
        ))}
      </section>
      <div className="about-manifesto">
        <span>{copy.process}</span>
        <p>{copy.processCopy}</p>
      </div>
    </div>
  );
}

function ContactPanel({ profile, language, copy }) {
  return (
    <div className="chapter-body contact-chapter">
      <p>{copy.contactLead}</p>
      <a className="contact-link" href={`mailto:${profile.email}`}>
        <span>{copy.startConversation}</span>
        <strong>{profile.email}</strong>
        <ArrowUpRight weight="bold" />
      </a>
      <div className="contact-meta">
        <span>{localize(profile.location, language)}</span>
        <span>{copy.emailOpen}</span>
      </div>
    </div>
  );
}

function ChapterPanel({ activeZone, content, onClose, language, copy }) {
  const definition = NAVIGATION.find((item) => item.id === activeZone);
  if (!definition) return null;

  return (
    <motion.aside
      key={activeZone}
      className={`chapter-panel chapter-panel--${activeZone}`}
      initial={{ opacity: 0, x: -92, scale: 0.965, rotateY: 7, filter: "blur(12px)" }}
      animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -64, scale: 0.975, rotateY: 5, filter: "blur(10px)" }}
      transition={{ duration: 0.68, ease: [0.16, 0.84, 0.18, 1] }}
      aria-label={`${copy.navigation[definition.id]} ${copy.chapter}`}
    >
      <div className="chapter-frame-data" aria-hidden="true">
        <span>JEM / NODE {definition.number}</span>
        <i />
        <span>LINK STABLE</span>
      </div>
      <motion.header
        className="chapter-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div><span>{copy.chapter} {definition.number} / 04</span><h2>{copy.navigation[definition.id]}</h2></div>
        <button type="button" onClick={onClose} aria-label={copy.closeChapter}><X weight="bold" /></button>
      </motion.header>
      <motion.div
        className="chapter-content-stage"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.56, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {activeZone === "work" && <WorkPanel content={content} language={language} copy={copy} />}
        {activeZone === "notes" && <NotesPanel notes={content.notes} language={language} copy={copy} />}
        {activeZone === "about" && <AboutPanel profile={content.profile} education={content.education} language={language} copy={copy} />}
        {activeZone === "contact" && <ContactPanel profile={content.profile} language={language} copy={copy} />}
      </motion.div>
      <motion.footer
        className="chapter-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.52, duration: 0.4 }}
      >
        <span>{copy.dragHint}</span><i /><span>{copy.escHint}</span>
      </motion.footer>
    </motion.aside>
  );
}

function SpatialTransit({ targetZone, copy }) {
  const definition = NAVIGATION.find((item) => item.id === targetZone);
  const label = definition ? copy.navigation[definition.id] : copy.spatialArchive;
  const number = definition?.number || "00";

  return (
    <motion.div
      className="spatial-transit"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      aria-hidden="true"
    >
      <motion.div
        className="spatial-transit__blade"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: [0, 1, 1], opacity: [0, 0.9, 0.32] }}
        transition={{ duration: 1.1, times: [0, 0.42, 1], ease: [0.22, 0.8, 0.2, 1] }}
      />
      <motion.div
        className="spatial-transit__target"
        initial={{ opacity: 0, x: 46, filter: "blur(10px)" }}
        animate={{ opacity: [0, 0.55, 0.18], x: [46, 0, -16], filter: ["blur(10px)", "blur(0px)", "blur(4px)"] }}
        transition={{ duration: 1.18, times: [0, 0.48, 1], ease: [0.16, 0.84, 0.18, 1] }}
      >
        <span>TARGET / {number}</span>
        <strong>{label}</strong>
      </motion.div>
      <div className="spatial-transit__telemetry"><i /><span>DEPTH LOCK</span><b>03.17</b></div>
    </motion.div>
  );
}

function WorldLabels({ labelRefs, activeZone, onSelect, copy }) {
  return (
    <div className={activeZone === "home" ? "world-labels" : "world-labels is-hidden"}>
      {ZONES.map((zone) => (
        <button
          key={zone.id}
          ref={(element) => { labelRefs.current[zone.id] = element; }}
          type="button"
          className="world-label"
          onClick={() => onSelect(zone.id)}
          aria-label={copy.zoneAria[zone.id]}
        >
          <span className="sr-only">{zone.number} {copy.navigation[zone.id]}</span>
          <ArrowRight weight="bold" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function ReferenceHotspots({ activeZone, sceneReady, entryLocked, onEnter, onHome, onSelect, copy }) {
  return (
    <div className={`reference-hotspots ${sceneReady ? "is-live" : ""}`}>
      <button
        type="button"
        className="reference-hotspot reference-hotspot--brand"
        onClick={onHome}
        aria-label={copy.returnHome}
        disabled={activeZone !== "home"}
      >
        <span>ZERO-GRAVITY IDENTITY STUDIO</span>
      </button>

      <nav className="reference-hotspot-navigation" aria-label={copy.primaryNavigation}>
        {NAVIGATION.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`reference-hotspot reference-hotspot--nav reference-hotspot--nav-${item.id} ${activeZone === item.id ? "is-active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span>{copy.navigation[item.id]}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        className="reference-hotspot reference-hotspot--enter"
        onClick={onEnter}
        disabled={entryLocked || activeZone !== "home"}
        aria-disabled={entryLocked || activeZone !== "home"}
      >
        <span>{sceneReady ? copy.exploreCity : copy.enterStudio}</span>
        <ArrowRight weight="bold" aria-hidden="true" />
      </button>

      {NAVIGATION.map((item) => (
        <button
          key={`tower-${item.id}`}
          type="button"
          className={`reference-hotspot reference-hotspot--tower reference-hotspot--tower-${item.id}`}
          onClick={() => onSelect(item.id)}
          aria-label={copy.zoneAria[item.id]}
          disabled={sceneReady}
        >
          <span>{item.number} {copy.navigation[item.id]}</span>
        </button>
      ))}
    </div>
  );
}

function PublicPortfolio({ content, navigate, language, onLanguageChange }) {
  const reducedMotion = useReducedMotion();
  const copy = getCopy(language);
  const [booted, setBooted] = useState(true);
  const [entered, setEntered] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [activeZone, setActiveZone] = useState("home");
  const [panelZone, setPanelZone] = useState(null);
  const [transitionTarget, setTransitionTarget] = useState("home");
  const [inTransit, setInTransit] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [signalMode, setSignalMode] = useState(false);
  const [eggMessage, setEggMessage] = useState("");
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const labelRefs = useRef({});
  const inputRef = useRef({ yaw: 0, pitch: 0, dolly: 0, activeUntil: 0 });
  const dragRef = useRef({ active: false, moved: false, pointerId: null, x: 0, y: 0, startX: 0, startY: 0 });
  const suppressSceneClickUntilRef = useRef(0);
  const transitionTimersRef = useRef(new Set());
  const transitionIdRef = useRef(0);
  const messageTimerRef = useRef(0);
  const coordinateClockRef = useRef(0);
  const cursorRef = useRef(null);
  const cursorCoreRef = useRef(null);
  const konamiRef = useRef([]);
  const sound = useAmbientSound();

  const clearTransitionTimers = useCallback(() => {
    transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    transitionTimersRef.current.clear();
  }, []);

  const scheduleTransition = useCallback((callback, delay, transitionId) => {
    const timer = window.setTimeout(() => {
      transitionTimersRef.current.delete(timer);
      if (transitionIdRef.current === transitionId) callback();
    }, delay);
    transitionTimersRef.current.add(timer);
  }, []);

  const resetCameraInput = useCallback((duration = 1500) => {
    inputRef.current.yaw = 0;
    inputRef.current.pitch = 0;
    inputRef.current.dolly = 0;
    inputRef.current.activeUntil = performance.now() + duration;
  }, []);

  const selectZone = useCallback((zone) => {
    const mode = getZoneSelectionMode({ zone, entered, sceneReady, activeZone });
    if (mode === "invalid" || mode === "noop") return;

    clearTransitionTimers();
    const transitionId = ++transitionIdRef.current;
    const fromReference = mode === "from-reference";
    setInTransit(true);
    setPanelZone(null);
    setTransitionTarget(zone);
    resetCameraInput(fromReference ? 1800 : 1400);

    if (fromReference) {
      setEntered(true);
      setSceneReady(false);
      setActiveZone("home");
      scheduleTransition(() => {
        setActiveZone(zone);
        setSceneReady(true);
      }, reducedMotion ? 20 : MOTION_TIMINGS.sceneUiReveal, transitionId);
      scheduleTransition(() => setPanelZone(zone), reducedMotion ? 40 : MOTION_TIMINGS.directPanelReveal, transitionId);
      scheduleTransition(() => setInTransit(false), reducedMotion ? 100 : MOTION_TIMINGS.directChapterSettle, transitionId);
      return;
    }

    setEntered(true);
    setSceneReady(true);
    scheduleTransition(() => setActiveZone(zone), reducedMotion ? 20 : MOTION_TIMINGS.chapterSwap, transitionId);
    scheduleTransition(() => setPanelZone(zone), reducedMotion ? 40 : MOTION_TIMINGS.chapterPanelReveal, transitionId);
    scheduleTransition(() => setInTransit(false), reducedMotion ? 100 : MOTION_TIMINGS.chapterTravelSettle, transitionId);
  }, [activeZone, clearTransitionTimers, entered, reducedMotion, resetCameraInput, sceneReady, scheduleTransition]);

  const returnHome = useCallback(() => {
    const mode = getReturnMode({ entered, activeZone, inTransit });
    if (mode === "noop") return;

    clearTransitionTimers();
    const transitionId = ++transitionIdRef.current;
    setInTransit(true);
    setPanelZone(null);
    setTransitionTarget("home");
    setSceneReady(false);
    resetCameraInput(1500);

    if (mode === "from-chapter") {
      setActiveZone("home");
      scheduleTransition(() => setEntered(false), reducedMotion ? 20 : MOTION_TIMINGS.returnRevealDelay, transitionId);
    } else {
      setEntered(false);
    }
    scheduleTransition(() => setInTransit(false), reducedMotion ? 100 : MOTION_TIMINGS.returnSettle, transitionId);
  }, [activeZone, clearTransitionTimers, entered, inTransit, reducedMotion, resetCameraInput, scheduleTransition]);

  const enterWorld = useCallback(() => {
    if (entered && sceneReady && activeZone === "home") {
      selectZone("work");
      return;
    }
    if (entered) return;

    clearTransitionTimers();
    const transitionId = ++transitionIdRef.current;
    setEntered(true);
    setSceneReady(false);
    setActiveZone("home");
    setPanelZone(null);
    setTransitionTarget("home");
    setInTransit(true);
    resetCameraInput(1600);
    scheduleTransition(() => setSceneReady(true), reducedMotion ? 20 : MOTION_TIMINGS.sceneUiReveal, transitionId);
    scheduleTransition(() => setInTransit(false), reducedMotion ? 100 : MOTION_TIMINGS.enterSettle, transitionId);
  }, [activeZone, clearTransitionTimers, entered, reducedMotion, resetCameraInput, sceneReady, scheduleTransition, selectZone]);

  useEffect(() => () => {
    clearTransitionTimers();
    window.clearTimeout(messageTimerRef.current);
  }, [clearTransitionTimers]);

  useEffect(() => {
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    const onKey = (event) => {
      const isTyping = event.target instanceof HTMLElement && Boolean(event.target.closest("input, textarea, select, [contenteditable='true']"));
      if (event.key === "Escape" && (entered || activeZone !== "home")) returnHome();
      if (isTyping) return;
      const index = Number(event.key) - 1;
      if (index >= 0 && index < NAVIGATION.length) selectZone(NAVIGATION[index].id);
      konamiRef.current = [...konamiRef.current, event.key].slice(-sequence.length);
      if (konamiRef.current.join("|").toLowerCase() === sequence.join("|").toLowerCase()) {
        setSignalMode(true);
        setEggMessage(copy.signalUnlocked);
        window.clearTimeout(messageTimerRef.current);
        messageTimerRef.current = window.setTimeout(() => setEggMessage(""), 3200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeZone, copy.signalUnlocked, entered, returnHome, selectZone]);

  const onPointerMove = (event) => {
    document.body.dataset.cursorActive = "true";
    cursorRef.current?.style.setProperty("transform", `translate3d(${event.clientX}px, ${event.clientY}px, 0)`);
    cursorCoreRef.current?.style.setProperty("transform", `translate3d(${event.clientX}px, ${event.clientY}px, 0)`);
    if (event.timeStamp - coordinateClockRef.current > 90) {
      coordinateClockRef.current = event.timeStamp;
      setCoordinates({ x: event.clientX, y: event.clientY });
    }
    if (!dragRef.current.active || reducedMotion || inTransit) return;
    inputRef.current.activeUntil = performance.now() + 700;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    if (Math.hypot(event.clientX - dragRef.current.startX, event.clientY - dragRef.current.startY) > 5) {
      dragRef.current.moved = true;
    }
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    const yawLimit = activeZone === "home" ? 0.28 : 0.36;
    const pitchLimit = activeZone === "home" ? 0.18 : 0.24;
    inputRef.current.yaw = Math.max(-yawLimit, Math.min(yawLimit, inputRef.current.yaw - dx * 0.0018));
    inputRef.current.pitch = Math.max(-pitchLimit, Math.min(pitchLimit, inputRef.current.pitch + dy * 0.0015));
  };

  const onPointerDown = (event) => {
    if (!entered || !sceneReady || inTransit) return;
    if (event.target.closest("button, a, input, textarea, .chapter-panel, .top-navigation")) return;
    dragRef.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    };
    setDragging(true);
    inputRef.current.activeUntil = performance.now() + 900;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const stopDrag = (event) => {
    if (!dragRef.current.active) return;
    if (dragRef.current.moved) suppressSceneClickUntilRef.current = performance.now() + 180;
    dragRef.current.active = false;
    setDragging(false);
    inputRef.current.activeUntil = performance.now() + 700;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onWheel = (event) => {
    if (!entered || !sceneReady || inTransit) return;
    if (event.target.closest(".chapter-panel")) return;
    const minDolly = activeZone === "home" ? -2.2 : -2.4;
    const maxDolly = activeZone === "home" ? 4.2 : 4.2;
    inputRef.current.dolly = Math.max(minDolly, Math.min(maxDolly, inputRef.current.dolly + event.deltaY * 0.0026));
    inputRef.current.activeUntil = performance.now() + 900;
  };

  const unlockTimestamp = () => {
    setSignalMode((current) => !current);
    setEggMessage(signalMode ? copy.signalNormalized : copy.quietHour);
    window.clearTimeout(messageTimerRef.current);
    messageTimerRef.current = window.setTimeout(() => setEggMessage(""), 2600);
  };

  const selectSceneZone = useCallback((zone) => {
    if (performance.now() < suppressSceneClickUntilRef.current) return;
    selectZone(zone);
  }, [selectZone]);

  return (
    <main
      className={`portfolio-shell ${entered ? "is-entered" : ""} ${sceneReady ? "is-scene-ready" : ""} ${inTransit ? "is-transitioning" : ""} ${dragging ? "is-dragging" : ""}`}
      onPointerMove={onPointerMove}
      onPointerDown={onPointerDown}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      onWheel={onWheel}
    >
      <JemWorld
        activeZone={activeZone}
        entered={entered}
        inputRef={inputRef}
        labelRefs={labelRefs}
        onSelect={selectSceneZone}
        reducedMotion={reducedMotion}
        signalMode={signalMode}
      />
      <img
        className="exact-reference-image"
        src="/assets/reference/jem-monolith-city-reference.png"
        alt=""
        aria-hidden="true"
      />
      <div className="scene-noise" aria-hidden="true" />

      <ReferenceHotspots
        activeZone={activeZone}
        sceneReady={sceneReady}
        entryLocked={entered && !sceneReady}
        onEnter={enterWorld}
        onHome={returnHome}
        onSelect={selectZone}
        copy={copy}
      />

      <LanguageSwitcher language={language} onChange={onLanguageChange} className="language-switcher--public" />

      <header className="site-header">
        <button className="site-brand" type="button" onClick={returnHome} aria-label={copy.returnHome}>
          <i aria-hidden="true" />
          <strong>ZERO-GRAVITY IDENTITY STUDIO</strong>
          <span>{copy.creativeImpact}</span>
        </button>
        <nav className="top-navigation" aria-label={copy.primaryNavigation}>
          {NAVIGATION.map((item) => (
            <button key={item.id} type="button" className={activeZone === item.id ? "is-active" : ""} onClick={() => selectZone(item.id)}>
              {copy.navigation[item.id]}
            </button>
          ))}
        </nav>
        <div className="utility-navigation">
          <button type="button" onClick={sound.toggle} aria-label={sound.enabled ? copy.turnSoundOff : copy.turnSoundOn}>
            {sound.enabled ? <SpeakerHigh weight="bold" /> : <SpeakerSlash weight="bold" />}
            <span>{sound.enabled ? copy.soundOn : copy.soundOff}</span>
          </button>
          <button type="button" onClick={() => navigate("/admin")} aria-label={copy.openManager}><GearSix weight="bold" /></button>
        </div>
      </header>

      <div className="frame-corners" aria-hidden="true">
        <Plus className="corner-top-left" weight="thin" />
        <Plus className="corner-top-right" weight="thin" />
        <Plus className="corner-bottom-left" weight="thin" />
        <Plus className="corner-bottom-right" weight="thin" />
      </div>

      <AnimatePresence>
        {booted && activeZone === "home" && (
          <motion.section className="hero-copy" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -26 }} transition={{ duration: 0.7 }}>
            <span className="hero-kicker">{copy.heroKicker}</span>
            <h1>JEM</h1>
            <p>{localize(content.profile.headline, language)}</p>
            <button type="button" className="enter-button" onClick={enterWorld}>
              <span>{entered ? copy.exploreField : copy.enterStudio}</span>
              <i /><ArrowRight weight="bold" />
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      <WorldLabels labelRefs={labelRefs} activeZone={activeZone} onSelect={selectZone} copy={copy} />

      <AnimatePresence mode="wait">
        {sceneReady && panelZone && panelZone === activeZone && (
          <ChapterPanel key={panelZone} activeZone={panelZone} content={content} onClose={returnHome} language={language} copy={copy} />
        )}
      </AnimatePresence>

      <aside className="chapter-rail" aria-label={copy.chapterIndex}>
        <span>{copy.chapter}</span>
        {NAVIGATION.map((item) => (
          <button key={item.id} type="button" className={activeZone === item.id ? "is-active" : ""} onClick={() => selectZone(item.id)}>{item.number}</button>
        ))}
      </aside>

      <footer className="world-hud">
        <div className="camera-readout">
          <span>X&nbsp; {(coordinates.x / 37.4).toFixed(4)}&nbsp; °</span>
          <span>Y&nbsp; {(-coordinates.y / 22.9).toFixed(4)}&nbsp; °</span>
          <span>Z&nbsp; 03.2014&nbsp; °</span>
          <b>CAM&nbsp;&nbsp; 35MM</b>
          <b>MODE&nbsp; ORBIT</b>
        </div>
        <p><span>{copy.dragOrbit}</span><i /><span>{copy.scrollDolly}</span><i /><span>{copy.numberTravel}</span></p>
        <button type="button" onClick={unlockTimestamp}>{copy.mouseConnected} <i /></button>
      </footer>

      <AnimatePresence>
        {inTransit && <SpatialTransit key={`transit-${transitionIdRef.current}`} targetZone={transitionTarget} copy={copy} />}
        {eggMessage && (
          <motion.div className="egg-message" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>{eggMessage}</motion.div>
        )}
      </AnimatePresence>

      <div ref={cursorRef} className="cursor-ring" aria-hidden="true" />
      <div ref={cursorCoreRef} className="cursor-core" aria-hidden="true" />

      <AnimatePresence>
        {!booted && <IntroSequence onComplete={() => setBooted(true)} reducedMotion={reducedMotion} copy={copy} />}
      </AnimatePresence>
    </main>
  );
}

const editorConfig = {
  experiences: {
    icon: Briefcase,
    prefix: "exp",
    fields: [
      ["company", "text"],
      ["role", "text"],
      ["period", "text"],
      ["summary", "textarea"],
      ["highlights", "textarea-list"],
      ["skills", "list"],
    ],
    empty: { company: "", role: "", period: "", summary: "", highlights: [], skills: [], published: false },
  },
  education: {
    icon: GraduationCap,
    prefix: "edu",
    fields: [
      ["school", "text"],
      ["degree", "text"],
      ["period", "text"],
    ],
    empty: { school: "", degree: "", period: "", published: false },
  },
  notes: {
    icon: Notebook,
    prefix: "note",
    fields: [
      ["title", "text"],
      ["excerpt", "textarea"],
      ["content", "textarea-large"],
      ["tag", "text"],
      ["date", "date"],
    ],
    empty: { title: "", excerpt: "", content: "", tag: "", date: new Date().toISOString().slice(0, 10), published: false },
  },
  projects: {
    icon: Database,
    prefix: "project",
    fields: [
      ["title", "text"],
      ["kicker", "text"],
      ["summary", "textarea"],
      ["highlights", "textarea-list"],
      ["tech", "list"],
      ["url", "url"],
    ],
    empty: { title: "", kicker: "", summary: "", highlights: [], tech: [], url: "", published: false },
  },
};

const LOCALIZED_ADMIN_FIELDS = new Set([
  "headline", "statement", "location", "availability", "intro", "focus", "medium",
  "company", "role", "period", "summary", "highlights", "skills", "school", "degree",
  "title", "excerpt", "content", "tag", "kicker", "tech",
]);

function ProfileEditor({ profile, onChange, language, copy }) {
  const fields = [
    ["headline", "text"],
    ["statement", "text"],
    ["focus", "text"],
    ["medium", "text"],
    ["location", "text"],
    ["availability", "text"],
    ["email", "email"],
    ["github", "url"],
    ["intro", "textarea"],
  ];
  const updateField = (key, nextValue) => {
    const next = LOCALIZED_ADMIN_FIELDS.has(key)
      ? updateLocalizedValue(profile[key], language, nextValue)
      : nextValue;
    onChange({ ...profile, [key]: next, name: "JEM" });
  };
  return (
    <section className="admin-editor">
      <div className="editor-title"><span>{copy.admin.publicIdentity}</span><h2>{copy.admin.profileTitle}</h2></div>
      <div className="admin-language-note"><span>{copy.admin.editingLanguage}</span><strong>{copy.languageName}</strong><p>{copy.admin.localizedHint}</p></div>
      <div className="identity-lock"><Check weight="bold" /><span>{copy.admin.nameLocked}</span><strong>JEM</strong></div>
      <div className="form-grid">
        {fields.map(([key, type]) => (
          <label key={key} className={type === "textarea" ? "is-wide" : ""}>
            <span>{copy.admin.fields[key]}</span>
            {type === "textarea" ? (
              <textarea rows="6" value={localize(profile[key], language)} onChange={(event) => updateField(key, event.target.value)} />
            ) : (
              <input type={type} value={LOCALIZED_ADMIN_FIELDS.has(key) ? localize(profile[key], language) : (profile[key] || "")} onChange={(event) => updateField(key, event.target.value)} />
            )}
          </label>
        ))}
      </div>
    </section>
  );
}

function CollectionEditor({ section, items, onChange, language, copy }) {
  const config = editorConfig[section];
  const [activeId, setActiveId] = useState(items[0]?.id);
  const active = items.find((item) => item.id === activeId) || items[0];

  useEffect(() => {
    if (!items.some((item) => item.id === activeId)) setActiveId(items[0]?.id);
  }, [activeId, items]);

  const updateActive = (patch) => {
    if (!active) return;
    onChange(items.map((item) => item.id === active.id ? { ...item, ...patch } : item));
  };

  const addItem = () => {
    const item = { id: createId(config.prefix), ...config.empty };
    onChange([item, ...items]);
    setActiveId(item.id);
  };

  const removeItem = () => {
    if (!active || !window.confirm(copy.admin.deleteConfirm)) return;
    onChange(items.filter((item) => item.id !== active.id));
  };

  const updateField = (key, type, rawValue) => {
    const parsed = type === "list" || type === "textarea-list"
      ? rawValue.split("\n").map((value) => value.trim()).filter(Boolean)
      : rawValue;
    updateActive({
      [key]: LOCALIZED_ADMIN_FIELDS.has(key)
        ? updateLocalizedValue(active[key], language, parsed)
        : parsed,
    });
  };

  const getFieldValue = (key, type) => {
    const value = LOCALIZED_ADMIN_FIELDS.has(key) ? localize(active[key], language) : (active[key] || "");
    return type === "list" || type === "textarea-list" ? (value || []).join("\n") : value;
  };

  const getTitle = (item) => localize(item.title || item.company || item.school, language);
  const getSubtitle = (item) => localize(item.role || item.tag || item.kicker || item.degree, language);
  const sectionLabel = copy.admin.sectionLabels[section];
  const singularLabel = copy.admin.singularLabels[section];

  return (
    <section className="admin-editor collection-editor">
      <div className="editor-heading">
        <div className="editor-title"><span>{copy.admin.spatialContent}</span><h2>{sectionLabel}</h2></div>
        <button className="admin-primary" type="button" onClick={addItem}><Plus weight="bold" /> {copy.admin.newItem} {singularLabel}</button>
      </div>
      <div className="admin-language-note"><span>{copy.admin.editingLanguage}</span><strong>{copy.languageName}</strong><p>{copy.admin.localizedHint}</p></div>
      <div className="collection-layout">
        <div className="collection-list">
          {items.map((item, index) => (
            <button key={item.id} type="button" className={active?.id === item.id ? "is-active" : ""} onClick={() => setActiveId(item.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{getTitle(item)}</strong>
              <small>{getSubtitle(item)}</small>
              <i className={item.published ? "is-published" : ""}>{item.published ? copy.admin.live : copy.admin.draft}</i>
            </button>
          ))}
          {!items.length && <p className="admin-empty">{copy.admin.empty}</p>}
        </div>
        {active && (
          <div className="form-grid collection-form">
            {config.fields.map(([key, type]) => (
              <label key={key} className={type.includes("list") || type.startsWith("textarea") ? "is-wide" : ""}>
                <span>{copy.admin.fields[key]}</span>
                {type.includes("list") || type.startsWith("textarea") ? (
                  <textarea rows={type === "textarea-large" ? 10 : type === "textarea-list" ? 8 : 5} value={getFieldValue(key, type)} onChange={(event) => updateField(key, type, event.target.value)} />
                ) : (
                  <input
                    type={type}
                    value={getFieldValue(key, type)}
                    onChange={(event) => updateField(key, type, event.target.value)}
                  />
                )}
              </label>
            ))}
            <label className="publish-control is-wide">
              <input type="checkbox" checked={Boolean(active.published)} onChange={(event) => updateActive({ published: event.target.checked })} />
              <span><strong>{active.published ? copy.admin.published : copy.admin.draft}</strong> {copy.admin.showPublic}</span>
            </label>
            <div className="danger-row is-wide">
              <button type="button" onClick={removeItem}><Trash weight="bold" /> {copy.admin.delete} {singularLabel}</button>
              <span>{copy.admin.autoSave}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AdminApp({ store, navigate, language, onLanguageChange }) {
  const copy = getCopy(language);
  const [section, setSection] = useState("profile");
  const [notice, setNotice] = useState(copy.admin.saved);
  const importRef = useRef(null);
  const menu = [
    ["profile", copy.admin.profile, User],
    ["experiences", copy.admin.experiences, Briefcase],
    ["education", copy.admin.education, GraduationCap],
    ["notes", copy.admin.notes, Notebook],
    ["projects", copy.admin.projects, Database],
  ];

  useEffect(() => {
    setNotice(copy.admin.saved);
  }, [copy.admin.saved]);

  const flash = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(copy.admin.saved), 2600);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jem-portfolio-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    flash(copy.admin.exportDone);
  };

  const importData = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.setContent(sanitizeImportedContent(JSON.parse(String(reader.result))));
        flash(copy.admin.importDone);
      } catch {
        flash(copy.admin.importFailed);
      }
    };
    reader.readAsText(file);
  };

  const resetData = () => {
    if (!window.confirm(copy.admin.resetConfirm)) return;
    store.reset();
    flash(copy.admin.resetDone);
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <button className="admin-brand" type="button" onClick={() => navigate("/")}><strong>JEM</strong><i /><span>{copy.admin.system}</span></button>
        <nav aria-label="Content sections">
          {menu.map(([id, label, Icon]) => (
            <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => setSection(id)}>
              <Icon weight="bold" aria-hidden="true" /><span>{label}</span><ArrowRight weight="bold" />
            </button>
          ))}
        </nav>
        <div className="admin-side-footer"><i /><span>{copy.admin.localMode}</span><small>{copy.admin.noCloud}</small></div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <div><span>{copy.admin.console}</span><strong>{copy.admin.archive}</strong></div>
          <div className="admin-actions">
            <LanguageSwitcher language={language} onChange={onLanguageChange} className="language-switcher--admin" />
            <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => importData(event.target.files?.[0])} />
            <button type="button" onClick={() => importRef.current?.click()}><UploadSimple weight="bold" /> {copy.admin.import}</button>
            <button type="button" onClick={exportData}><DownloadSimple weight="bold" /> {copy.admin.export}</button>
            <button type="button" onClick={resetData}><Trash weight="bold" /> {copy.admin.reset}</button>
            <button className="admin-preview" type="button" onClick={() => navigate("/")}>{copy.admin.viewWorld} <ArrowUpRight weight="bold" /></button>
          </div>
        </header>
        <div className="admin-status"><i /><span>{notice}</span></div>
        {section === "profile" ? (
          <ProfileEditor profile={store.content.profile} onChange={(value) => store.updateSection("profile", value)} language={language} copy={copy} />
        ) : (
          <CollectionEditor section={section} items={store.content[section]} onChange={(value) => store.updateSection(section, value)} language={language} copy={copy} />
        )}
      </div>
    </main>
  );
}

export function App() {
  const [pathname, navigate] = usePathname();
  const store = useContentStore();
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === "en" || stored === "zh" ? stored : "en";
  });

  const changeLanguage = useCallback((nextLanguage) => {
    if (nextLanguage !== "zh" && nextLanguage !== "en") return;
    setLanguage(nextLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_KEY, language);
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  useEffect(() => {
    const onPointer = () => { document.body.dataset.inputMode = "pointer"; };
    const onKeyboard = (event) => {
      if (event.key === "Tab" || event.key.startsWith("Arrow")) document.body.dataset.inputMode = "keyboard";
    };
    window.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("keydown", onKeyboard, true);
    return () => {
      delete document.body.dataset.cursorActive;
      window.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("keydown", onKeyboard, true);
    };
  }, []);

  useEffect(() => {
    if (!LOCAL_ADMIN_ENABLED && pathname.startsWith("/admin")) navigate("/");
  }, [navigate, pathname]);

  return LOCAL_ADMIN_ENABLED && pathname.startsWith("/admin")
    ? <AdminApp store={store} navigate={navigate} language={language} onLanguageChange={changeLanguage} />
    : <TensionPortfolio content={store.content} navigate={navigate} pathname={pathname} language={language} onLanguageChange={changeLanguage} />;
}
