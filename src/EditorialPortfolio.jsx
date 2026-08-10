import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
  GearSix,
  List,
  MagnifyingGlass,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import { EditorialWorld } from "./EditorialWorld";
import { localize } from "./content";

const SECTIONS = ["home", "work", "projects", "notes", "about", "contact"];

const PUBLIC_COPY = {
  zh: {
    nav: { work: "经历", projects: "项目", notes: "笔记", about: "关于", contact: "联系" },
    portfolio: "个人作品集",
    current: "当前",
    selectedExperience: "精选经历",
    selectedProject: "精选项目",
    latestNotes: "最近笔记",
    homeEyebrow: "测试开发工程师 / 2026",
    homeTitle: "把复杂系统，做成可靠体验。",
    homeLead: "从芯片软件工具链、CI/CD 到 AI 辅助质量工程，我把复杂验证流程整理成稳定、可观测、可持续演进的工程系统。",
    exploreWork: "查看工作经历",
    viewCase: "查看成果",
    closeCase: "收起成果",
    viewAllProjects: "浏览项目",
    readNote: "阅读全文",
    closeNote: "返回列表",
    previous: "上一项",
    next: "下一项",
    skills: "工具与能力",
    impact: "关键成果",
    experience: "工作经历",
    education: "教育经历",
    process: "工作方式",
    processText: "先把系统和风险看清，再把反馈路径缩短，最后让团队能够长期维护和演进。",
    notesIntro: "关于质量工程、自动化系统和 AI 工程实践的工作笔记。",
    search: "搜索笔记",
    noNotes: "没有找到匹配的笔记。",
    contactTitle: "一起解决一个真正复杂的问题。",
    contactLead: "如果你正在构建质量平台、芯片工具链或复杂工程系统，欢迎给我写信。",
    name: "称呼",
    email: "邮箱",
    message: "想聊什么？",
    send: "发送邮件",
    sent: "已准备好邮件内容",
    sentHelp: "你的邮件客户端将打开，你也可以直接复制下方地址。",
    location: "地点",
    status: "状态",
    focus: "方向",
    language: "语言",
    drag: "移动鼠标 / 查看空间",
    keyboard: "1—5 / 切换页面",
    menu: "菜单",
    manager: "内容后台",
    sceneLabel: "实时 3D 空间",
    signalNormal: "信号稳定",
    signalSecret: "粉色信号已唤醒",
    available: "可进行精选合作",
    contactDirect: "直接联系",
  },
  en: {
    nav: { work: "WORK", projects: "PROJECTS", notes: "NOTES", about: "ABOUT", contact: "CONTACT" },
    portfolio: "PORTFOLIO",
    current: "CURRENT",
    selectedExperience: "SELECTED EXPERIENCE",
    selectedProject: "SELECTED PROJECT",
    latestNotes: "RECENT NOTES",
    homeEyebrow: "TEST DEVELOPMENT ENGINEER / 2026",
    homeTitle: "Complex systems, made reliable.",
    homeLead: "From chip software toolchains and CI/CD to AI-assisted quality engineering, I turn complex validation flows into reliable, observable systems.",
    exploreWork: "EXPLORE EXPERIENCE",
    viewCase: "VIEW CASE STUDY",
    closeCase: "CLOSE CASE STUDY",
    viewAllProjects: "VIEW PROJECTS",
    readNote: "READ NOTE",
    closeNote: "BACK TO INDEX",
    previous: "PREVIOUS",
    next: "NEXT",
    skills: "TOOLS & CAPABILITIES",
    impact: "SELECTED IMPACT",
    experience: "EXPERIENCE",
    education: "EDUCATION",
    process: "PROCESS",
    processText: "Understand the system and its risks, shorten the feedback path, then make the result maintainable for the team.",
    notesIntro: "Working notes on quality engineering, automation systems and applied AI.",
    search: "SEARCH NOTES",
    noNotes: "NO MATCHING NOTES.",
    contactTitle: "Let's solve something genuinely complex.",
    contactLead: "If you are building a quality platform, chip toolchain, or complex engineering system, I would like to hear about it.",
    name: "YOUR NAME",
    email: "EMAIL",
    message: "WHAT ARE YOU BUILDING?",
    send: "COMPOSE EMAIL",
    sent: "EMAIL DRAFT READY",
    sentHelp: "Your mail app will open. You can also copy the address below.",
    location: "LOCATION",
    status: "STATUS",
    focus: "FOCUS",
    language: "LANGUAGE",
    drag: "MOVE POINTER / INSPECT SPACE",
    keyboard: "1—5 / CHANGE PAGE",
    menu: "MENU",
    manager: "CONTENT MANAGER",
    sceneLabel: "LIVE 3D SPACE",
    signalNormal: "SIGNAL STABLE",
    signalSecret: "PINK SIGNAL AWAKENED",
    available: "OPEN TO SELECTED COLLABORATIONS",
    contactDirect: "DIRECT CONTACT",
  },
};

function sectionFromPath(pathname) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return SECTIONS.includes(segment) ? segment : "home";
}

function displayCompany(item, language) {
  const company = localize(item?.company, language);
  if (language === "en") {
    if (item?.id === "exp-united-imaging") return "United Imaging";
    if (item?.id === "exp-xpeng") return "XPeng";
    if (item?.id === "exp-kingdom") return "Kingdom Technology";
  }
  if (item?.id === "exp-united-imaging") return "联影医疗";
  if (item?.id === "exp-kingdom") return "金证科技";
  return company;
}

function LanguageControl({ language, onChange, compact = false }) {
  return (
    <div className={`editorial-language ${compact ? "is-compact" : ""}`} aria-label="Language">
      <button type="button" className={language === "zh" ? "is-active" : ""} onClick={() => onChange("zh")}>中</button>
      <span>/</span>
      <button type="button" className={language === "en" ? "is-active" : ""} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

function EditorialHeader({ activeSection, language, onLanguageChange, onNavigate, onAdmin, menuOpen, setMenuOpen, copy }) {
  return (
    <header className="editorial-header">
      <button className="editorial-brand" type="button" onClick={() => onNavigate("home")} aria-label="JEM home">
        <strong>JEM</strong><span>/</span><small>{copy.portfolio}</small>
      </button>
      <nav className="editorial-nav" aria-label="Primary navigation">
        {SECTIONS.slice(1).map((id) => (
          <button key={id} type="button" className={activeSection === id ? "is-active" : ""} onClick={() => onNavigate(id)}>
            {copy.nav[id]}
            {activeSection === id && <motion.i layoutId="editorial-active-nav" />}
          </button>
        ))}
      </nav>
      <div className="editorial-tools">
        <span className="editorial-availability"><i />{copy.available}</span>
        <LanguageControl language={language} onChange={onLanguageChange} />
        <button className="editorial-admin-link" type="button" onClick={onAdmin} aria-label={copy.manager}><GearSix weight="bold" /></button>
        <button className="editorial-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={copy.menu}>
          {menuOpen ? <X weight="bold" /> : <List weight="bold" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav className="editorial-mobile-menu" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            {SECTIONS.slice(1).map((id, index) => (
              <button key={id} type="button" className={activeSection === id ? "is-active" : ""} onClick={() => onNavigate(id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{copy.nav[id]}</strong><ArrowRight weight="bold" />
              </button>
            ))}
            <div><LanguageControl language={language} onChange={onLanguageChange} compact /><button type="button" onClick={onAdmin}>{copy.manager}</button></div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function PageFrame({ section, number, eyebrow, children, footer, transitionDirection }) {
  return (
    <motion.section
      className={`editorial-page editorial-page--${section}`}
      initial={{ opacity: 0, x: transitionDirection > 0 ? 28 : -28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: transitionDirection > 0 ? -22 : 22 }}
      transition={{ duration: 0.52, ease: [0.16, 0.84, 0.18, 1] }}
    >
      <div className="editorial-page-kicker"><span>{eyebrow}</span><i /><small>{number} / 05</small></div>
      {children}
      {footer}
    </motion.section>
  );
}

function HomePage({ content, language, copy, onNavigate, transitionDirection }) {
  const current = content.experiences.filter((item) => item.published)[0];
  return (
    <PageFrame section="home" number="00" eyebrow={copy.homeEyebrow} transitionDirection={transitionDirection}>
      <div className="home-heading-wrap">
        <motion.h1 layoutId="editorial-primary-title">{copy.homeTitle}</motion.h1>
        <p>{copy.homeLead}</p>
      </div>
      <button className="editorial-primary-action" type="button" onClick={() => onNavigate("work")}>
        <span>{copy.exploreWork}</span><i /><ArrowRight weight="bold" />
      </button>
      {current && (
        <button className="home-current" type="button" onClick={() => onNavigate("work")}>
          <span>{copy.current}</span>
          <strong>{localize(current.company, language)}</strong>
          <small>{localize(current.role, language)}</small>
          <b>{localize(current.period, language)}</b>
          <ArrowUpRight weight="bold" />
        </button>
      )}
      <div className="home-meta-grid">
        <div><span>{copy.focus}</span><strong>{localize(content.profile.focus, language)}</strong></div>
        <div><span>{copy.location}</span><strong>{localize(content.profile.location, language)}</strong></div>
        <div><span>{copy.status}</span><strong>{localize(content.profile.availability, language)}</strong></div>
      </div>
    </PageFrame>
  );
}

function WorkPage({ experiences, language, copy, activeIndex, setActiveIndex, expanded, setExpanded, transitionDirection, onNavigate }) {
  const active = experiences[activeIndex] || experiences[0];
  if (!active) return null;
  const cycle = (offset) => setActiveIndex((activeIndex + offset + experiences.length) % experiences.length);
  return (
    <PageFrame
      section="work"
      number="01"
      eyebrow={copy.selectedExperience}
      transitionDirection={transitionDirection}
      footer={(
        <footer className="editorial-page-footer">
          <button type="button" onClick={() => cycle(-1)}><small>{copy.previous}</small><span><ArrowLeft weight="bold" /> {localize(experiences[(activeIndex - 1 + experiences.length) % experiences.length]?.company, language)}</span></button>
          <button className="footer-grid-button" type="button" onClick={() => onNavigate("projects")} aria-label={copy.viewAllProjects}><SquaresFour weight="fill" /></button>
          <button type="button" onClick={() => cycle(1)}><small>{copy.next}</small><span>{localize(experiences[(activeIndex + 1) % experiences.length]?.company, language)} <ArrowRight weight="bold" /></span></button>
        </footer>
      )}
    >
      <AnimatePresence mode="wait">
        <motion.article className="work-feature" key={active.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.36 }}>
          <span>{localize(active.period, language)}</span>
          <motion.h1 layoutId="editorial-primary-title">{displayCompany(active, language)}</motion.h1>
          <h2>{localize(active.role, language)}</h2>
          <p>{localize(active.summary, language)}</p>
          <button className="editorial-outline-action" type="button" onClick={() => setExpanded((value) => !value)}>
            <span>{expanded ? copy.closeCase : copy.viewCase}</span><ArrowRight weight="bold" />
          </button>
        </motion.article>
      </AnimatePresence>
      <div className="work-lower">
        <div className="work-timeline" aria-label={copy.experience}>
          {experiences.map((item, index) => (
            <button key={item.id} type="button" className={activeIndex === index ? "is-active" : ""} onClick={() => { setActiveIndex(index); setExpanded(false); }}>
              <i /><span>{localize(item.period, language)}</span><strong>{displayCompany(item, language)}</strong><small>{localize(item.role, language)}</small>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {expanded && (
            <motion.div className="work-impact" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <span>{copy.impact}</span>
              <ul>{(localize(active.highlights, language) || []).slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul>
              <div>{(localize(active.skills, language) || []).map((item) => <small key={item}>{item}</small>)}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageFrame>
  );
}

function ProjectsPage({ projects, language, copy, activeIndex, setActiveIndex, transitionDirection, onNavigate }) {
  const active = projects[activeIndex] || projects[0];
  if (!active) return null;
  return (
    <PageFrame
      section="projects"
      number="02"
      eyebrow={copy.selectedProject}
      transitionDirection={transitionDirection}
      footer={(
        <footer className="editorial-page-footer editorial-page-footer--simple">
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => onNavigate("notes")}>{copy.latestNotes} <ArrowRight weight="bold" /></button>
        </footer>
      )}
    >
      <AnimatePresence mode="wait">
        <motion.article className="project-feature" key={active.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <span>{localize(active.kicker, language)}</span>
          <motion.h1 layoutId="editorial-primary-title">{localize(active.title, language)}</motion.h1>
          <p>{localize(active.summary, language)}</p>
          <div className="project-tech">{(localize(active.tech, language) || []).map((item) => <small key={item}>{item}</small>)}</div>
          <div className="project-impact-list">{(localize(active.highlights, language) || []).map((item, index) => <p key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</p>)}</div>
        </motion.article>
      </AnimatePresence>
      <div className="project-index">
        {projects.map((item, index) => (
          <button key={item.id} type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => setActiveIndex(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{localize(item.title, language)}</strong><small>{localize(item.kicker, language)}</small><ArrowRight weight="bold" />
          </button>
        ))}
      </div>
    </PageFrame>
  );
}

function NotesPage({ notes, language, copy, activeIndex, setActiveIndex, transitionDirection }) {
  const [query, setQuery] = useState("");
  const [reading, setReading] = useState(false);
  const filtered = useMemo(() => notes.filter((note) => `${localize(note.title, language)} ${localize(note.tag, language)}`.toLowerCase().includes(query.toLowerCase())), [language, notes, query]);
  const active = filtered[activeIndex] || filtered[0];
  useEffect(() => setActiveIndex(0), [query, setActiveIndex]);
  return (
    <PageFrame section="notes" number="03" eyebrow={copy.latestNotes} transitionDirection={transitionDirection}>
      <div className="notes-heading">
        <motion.h1 layoutId="editorial-primary-title">{copy.nav.notes}</motion.h1><p>{copy.notesIntro}</p>
      </div>
      <label className="editorial-search"><MagnifyingGlass weight="bold" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
      <AnimatePresence mode="wait">
        {reading && active ? (
          <motion.article key={`reader-${active.id}`} className="note-full" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
            <span>{active.date} / {localize(active.tag, language)}</span>
            <h2>{localize(active.title, language)}</h2>
            <strong>{localize(active.excerpt, language)}</strong>
            <p>{localize(active.content, language)}</p>
            <button type="button" onClick={() => setReading(false)}><ArrowLeft weight="bold" /> {copy.closeNote}</button>
          </motion.article>
        ) : (
          <motion.div key="notes-index" className="notes-index" initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 18 }}>
            {filtered.map((note, index) => (
              <button key={note.id} type="button" className={index === activeIndex ? "is-active" : ""} onClick={() => { setActiveIndex(index); setReading(true); }}>
                <span>{note.date}</span><strong>{localize(note.title, language)}</strong><small>{localize(note.tag, language)}</small><ArrowUpRight weight="bold" />
              </button>
            ))}
            {!filtered.length && <p className="editorial-empty">{copy.noNotes}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </PageFrame>
  );
}

function AboutPage({ content, language, copy, transitionDirection, onNavigate }) {
  return (
    <PageFrame
      section="about"
      number="04"
      eyebrow="JEM / PROFILE"
      transitionDirection={transitionDirection}
      footer={<footer className="editorial-page-footer editorial-page-footer--simple"><span>{copy.available}</span><button type="button" onClick={() => onNavigate("contact")}>{copy.contactDirect} <ArrowRight weight="bold" /></button></footer>}
    >
      <motion.h1 className="about-title" layoutId="editorial-primary-title">JEM</motion.h1>
      <p className="about-intro">{localize(content.profile.intro, language)}</p>
      <div className="about-facts">
        <div><span>{copy.focus}</span><strong>{localize(content.profile.focus, language)}</strong></div>
        <div><span>{copy.skills}</span><strong>{localize(content.profile.medium, language)}</strong></div>
        <div><span>{copy.location}</span><strong>{localize(content.profile.location, language)}</strong></div>
      </div>
      <div className="about-columns">
        <section><span>{copy.education}</span>{content.education.filter((item) => item.published).map((item) => <article key={item.id}><small>{localize(item.period, language)}</small><strong>{localize(item.school, language)}</strong><p>{localize(item.degree, language)}</p></article>)}</section>
        <section><span>{copy.process}</span><p>{copy.processText}</p></section>
      </div>
    </PageFrame>
  );
}

function ContactPage({ profile, language, copy, transitionDirection }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || "visitor"}`);
    const body = encodeURIComponent(`${form.message}\n\n${form.name}\n${form.email}`);
    setSent(true);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };
  return (
    <PageFrame section="contact" number="05" eyebrow={copy.nav.contact} transitionDirection={transitionDirection}>
      <motion.h1 className="contact-title" layoutId="editorial-primary-title">{copy.contactTitle}</motion.h1>
      <p className="contact-lead">{copy.contactLead}</p>
      <form className="contact-form" onSubmit={submit}>
        <label htmlFor="contact-name"><span>{copy.name}</span><input id="contact-name" name="name" autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label htmlFor="contact-email"><span>{copy.email}</span><input id="contact-email" name="email" autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="is-wide" htmlFor="contact-message"><span>{copy.message}</span><textarea id="contact-message" name="message" required rows="4" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
        <button type="submit"><span>{copy.send}</span><i /><ArrowUpRight weight="bold" /></button>
      </form>
      <AnimatePresence>{sent && <motion.div className="contact-success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><CheckCircle weight="fill" /><div><strong>{copy.sent}</strong><span>{copy.sentHelp}</span></div></motion.div>}</AnimatePresence>
      <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight weight="bold" /></a>
    </PageFrame>
  );
}

export function EditorialPortfolio({ content, navigate, pathname, language, onLanguageChange }) {
  const copy = PUBLIC_COPY[language] || PUBLIC_COPY.zh;
  const reducedMotion = useReducedMotion();
  const section = sectionFromPath(pathname);
  const [sceneSection, setSceneSection] = useState(section);
  const [pendingSection, setPendingSection] = useState(null);
  const [direction, setDirection] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [workIndex, setWorkIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);
  const [noteIndex, setNoteIndex] = useState(0);
  const [workExpanded, setWorkExpanded] = useState(false);
  const [signalMode, setSignalMode] = useState(false);
  const timerRef = useRef(0);
  const konamiRef = useRef([]);

  const experiences = content.experiences.filter((item) => item.published);
  const projects = content.projects.filter((item) => item.published);
  const notes = content.notes.filter((item) => item.published);
  const focusIndex = section === "work" ? workIndex : section === "projects" ? projectIndex : section === "notes" ? noteIndex : 0;

  useEffect(() => {
    if (!pendingSection) setSceneSection(section);
  }, [pendingSection, section]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const onNavigate = useCallback((nextSection) => {
    if (!SECTIONS.includes(nextSection) || nextSection === (pendingSection || section)) return;
    window.clearTimeout(timerRef.current);
    setDirection(SECTIONS.indexOf(nextSection) >= SECTIONS.indexOf(section) ? 1 : -1);
    setPendingSection(nextSection);
    setSceneSection(nextSection);
    setMenuOpen(false);
    setWorkExpanded(false);
    const path = nextSection === "home" ? "/" : `/${nextSection}`;
    timerRef.current = window.setTimeout(() => {
      navigate(path);
      setPendingSection(null);
    }, reducedMotion ? 30 : 420);
  }, [navigate, pendingSection, reducedMotion, section]);

  useEffect(() => {
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      const numericIndex = Number(event.key) - 1;
      if (numericIndex >= 0 && numericIndex < 5) onNavigate(SECTIONS[numericIndex + 1]);
      if (event.key === "Escape") onNavigate("home");
      konamiRef.current = [...konamiRef.current, event.key].slice(-sequence.length);
      if (konamiRef.current.join("|").toLowerCase() === sequence.join("|").toLowerCase()) setSignalMode(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  const activeSection = pendingSection || section;

  return (
    <LayoutGroup>
      <main className={`editorial-shell ${pendingSection ? "is-navigating" : ""} ${signalMode ? "is-signal-mode" : ""}`}>
        <EditorialHeader
          activeSection={activeSection}
          language={language}
          onLanguageChange={onLanguageChange}
          onNavigate={onNavigate}
          onAdmin={() => navigate("/admin")}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          copy={copy}
        />
        <div className="editorial-stage">
          <section className="editorial-scene" aria-label={copy.sceneLabel}>
            <EditorialWorld section={sceneSection} focusIndex={focusIndex} reducedMotion={reducedMotion} signalMode={signalMode} />
            <div className="editorial-scene-vignette" aria-hidden="true" />
            <div className="scene-readout"><span><i />{copy.sceneLabel}</span><strong>{String(Math.max(0, SECTIONS.indexOf(sceneSection))).padStart(2, "0")}</strong></div>
            <AnimatePresence mode="wait">
              <motion.div className="scene-object-label" key={sceneSection} initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
                <strong>{String(Math.max(0, SECTIONS.indexOf(sceneSection))).padStart(2, "0")}</strong><i /><span>{sceneSection === "home" ? "JEM" : copy.nav[sceneSection]}</span>
              </motion.div>
            </AnimatePresence>
            <button className="scene-secret" type="button" onClick={() => setSignalMode((value) => !value)}><span>{signalMode ? copy.signalSecret : copy.signalNormal}</span><strong>03:17</strong></button>
            <div className="scene-instructions"><span>{copy.drag}</span><i /><span>{copy.keyboard}</span></div>
          </section>
          <section className="editorial-content-panel">
            <AnimatePresence mode="wait" initial={false}>
              {section === "home" && <HomePage key="home" content={content} language={language} copy={copy} onNavigate={onNavigate} transitionDirection={direction} />}
              {section === "work" && <WorkPage key="work" experiences={experiences} language={language} copy={copy} activeIndex={workIndex} setActiveIndex={setWorkIndex} expanded={workExpanded} setExpanded={setWorkExpanded} transitionDirection={direction} onNavigate={onNavigate} />}
              {section === "projects" && <ProjectsPage key="projects" projects={projects} language={language} copy={copy} activeIndex={projectIndex} setActiveIndex={setProjectIndex} transitionDirection={direction} onNavigate={onNavigate} />}
              {section === "notes" && <NotesPage key="notes" notes={notes} language={language} copy={copy} activeIndex={noteIndex} setActiveIndex={setNoteIndex} transitionDirection={direction} />}
              {section === "about" && <AboutPage key="about" content={content} language={language} copy={copy} transitionDirection={direction} onNavigate={onNavigate} />}
              {section === "contact" && <ContactPage key="contact" profile={content.profile} language={language} copy={copy} transitionDirection={direction} />}
            </AnimatePresence>
          </section>
        </div>
      </main>
    </LayoutGroup>
  );
}
