import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  Copy,
  Database,
  DownloadSimple,
  GearSix,
  GithubLogo,
  GlobeSimple,
  List,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react";
import { localize } from "./content";

const TensionCover = lazy(() => import("./TensionCover").then((module) => ({ default: module.TensionCover })));
const LOCAL_ADMIN_ENABLED = import.meta.env.DEV;

const SECTIONS = ["home", "work", "projects", "resume", "notes", "about", "contact"];

const COPY = {
  zh: {
    portfolio: "个人作品集",
    nav: { home: "首页", work: "经历", projects: "项目", resume: "简历", notes: "笔记", about: "关于", contact: "联系" },
    menu: "菜单",
    manager: "内容后台",
    available: "可进行精选合作",
    signal: "信号稳定",
    signalActive: "隐藏信号已开启",
    homeKicker: "爬虫 / 数据 / 自动化",
    homeTitle: "欢迎来到我的空间。",
    homeLead: "后续我将在这里完成并持续展示更多爬虫作品，把采集、清洗、分析和可视化做成真正可用的产品。",
    explore: "查看爬虫作品",
    current: "当前角色",
    selectedExperience: "精选经历",
    outcome: "关键成果",
    tools: "技术与工具",
    previous: "上一项",
    next: "下一项",
    projectsLead: "能够真实落地、长期运行，并且让团队效率发生变化的工程系统。",
    projectPreview: "真实项目预览",
    projectSite: "产品首页",
    projectJobs: "招聘数据页",
    openProject: "打开线上项目",
    privateProject: "内部工程系统，没有公开预览。",
    crawlerLabel: "数据来源",
    crawlerValue: "多站点分布式爬虫",
    resumeKicker: "可读、可复制、可下载",
    resumeLead: "这是一份真正的 Markdown 简历。内容与作品集保持一致，并随中英文切换更新。",
    resumeCopy: "复制 Markdown",
    resumeCopied: "已复制",
    resumeDownload: "下载 .MD",
    resumeSections: { profile: "概述", experience: "工作经历", projects: "项目", skills: "技能" },
    notesLead: "关于质量工程、自动化系统和 AI 工程实践的工作笔记。",
    search: "搜索笔记",
    read: "阅读",
    back: "返回笔记列表",
    empty: "没有找到匹配的笔记。",
    profile: "个人档案",
    approach: "工作方式",
    approachText: "先识别系统风险，再缩短反馈路径，最后把经验沉淀成团队可持续维护的工程能力。",
    location: "地点",
    focus: "方向",
    status: "状态",
    contactTitle: "把一个真正复杂的问题，讲给我听。",
    contactLead: "如果你正在构建质量平台、芯片工具链或复杂工程系统，欢迎联系。",
    name: "称呼",
    email: "邮箱",
    message: "想解决什么问题？",
    send: "准备邮件",
    sent: "邮件内容已准备好",
    sentHelp: "系统将打开你的邮件客户端，也可以直接复制下方邮箱。",
    github: "GITHUB",
  },
  en: {
    portfolio: "PORTFOLIO",
    nav: { home: "HOME", work: "WORK", projects: "PROJECTS", resume: "RESUME", notes: "NOTES", about: "ABOUT", contact: "CONTACT" },
    menu: "MENU",
    manager: "CONTENT MANAGER",
    available: "OPEN TO SELECTED COLLABORATIONS",
    signal: "SIGNAL STABLE",
    signalActive: "HIDDEN SIGNAL ACTIVE",
    homeKicker: "CRAWLERS / DATA / AUTOMATION",
    homeTitle: "Welcome to my space.",
    homeLead: "This is where I will keep building and sharing crawler projects—turning collection, cleaning, analysis and visualisation into products people can actually use.",
    explore: "EXPLORE CRAWLER PROJECTS",
    current: "CURRENT ROLE",
    selectedExperience: "SELECTED EXPERIENCE",
    outcome: "SELECTED OUTCOMES",
    tools: "TOOLS + CAPABILITIES",
    previous: "PREVIOUS",
    next: "NEXT",
    projectsLead: "Engineering systems that ship, keep running, and materially change how teams work.",
    projectPreview: "LIVE PRODUCT CAPTURE",
    projectSite: "PRODUCT HOME",
    projectJobs: "JOBS DATA",
    openProject: "OPEN LIVE PROJECT",
    privateProject: "INTERNAL ENGINEERING SYSTEM — NO PUBLIC PREVIEW.",
    crawlerLabel: "DATA SOURCE",
    crawlerValue: "DISTRIBUTED MULTI-SITE CRAWLER",
    resumeKicker: "READABLE / COPYABLE / DOWNLOADABLE",
    resumeLead: "A real Markdown resume kept in sync with the portfolio and the active language.",
    resumeCopy: "COPY MARKDOWN",
    resumeCopied: "COPIED",
    resumeDownload: "DOWNLOAD .MD",
    resumeSections: { profile: "PROFILE", experience: "EXPERIENCE", projects: "PROJECTS", skills: "SKILLS" },
    notesLead: "Working notes on quality engineering, automation systems and applied AI.",
    search: "SEARCH NOTES",
    read: "READ",
    back: "BACK TO NOTES",
    empty: "NO MATCHING NOTES.",
    profile: "PROFILE",
    approach: "APPROACH",
    approachText: "Understand the system risk, shorten the feedback path, then turn the result into maintainable team capability.",
    location: "LOCATION",
    focus: "FOCUS",
    status: "STATUS",
    contactTitle: "Tell me about something genuinely complex.",
    contactLead: "If you are building a quality platform, chip toolchain, or complex engineering system, I would like to hear about it.",
    name: "YOUR NAME",
    email: "EMAIL",
    message: "WHAT ARE YOU BUILDING?",
    send: "COMPOSE EMAIL",
    sent: "EMAIL DRAFT READY",
    sentHelp: "Your mail client will open. You can also copy the address below.",
    github: "GITHUB",
  },
};

const PROJECT_MEDIA = {
  "project-web3-jobs": [
    { id: "home", src: "/assets/projects/cryptosquare-home.jpg", url: "https://cryptosquare.org", labelKey: "projectSite" },
    { id: "jobs", src: "/assets/projects/cryptosquare-jobs.jpg", url: "https://cryptosquare.org/jobs?lng=zh-CN", labelKey: "projectJobs" },
  ],
};

function sectionFromPath(pathname) {
  const segment = pathname.split("/").filter(Boolean)[0];
  return SECTIONS.includes(segment) ? segment : "home";
}

function displayCompany(item, language) {
  if (language === "en") {
    if (item?.id === "exp-united-imaging") return "HEALTHCARE TECHNOLOGY COMPANY";
    if (item?.id === "exp-xpeng") return "SMART EV COMPANY";
    if (item?.id === "exp-kingdom") return "FINTECH COMPANY";
  }
  if (item?.id === "exp-united-imaging") return "医疗科技公司";
  if (item?.id === "exp-xpeng") return "智能汽车公司";
  if (item?.id === "exp-kingdom") return "金融科技公司";
  return localize(item?.company, language);
}

function buildResumeMarkdown(content, language, copy) {
  const profile = content.profile;
  const experiences = content.experiences.filter((item) => item.published);
  const projects = content.projects.filter((item) => item.published);
  const skills = [...new Set([
    ...experiences.flatMap((item) => localize(item.skills, language) || []),
    ...projects.flatMap((item) => localize(item.tech, language) || []),
  ])];
  const lines = [
    "# JEM",
    "",
    `> ${localize(profile.headline, language)}`,
    "",
    `[${profile.email}](mailto:${profile.email}) · [github.com/Guuu16](${profile.github})`,
    "",
    `## ${copy.resumeSections.profile}`,
    "",
    localize(profile.intro, language),
    "",
    `- ${copy.focus}: ${localize(profile.focus, language)}`,
    `- ${copy.location}: ${localize(profile.location, language)}`,
    `- ${copy.status}: ${localize(profile.availability, language)}`,
    "",
    `## ${copy.resumeSections.experience}`,
    "",
  ];
  experiences.forEach((item) => {
    lines.push(`### ${displayCompany(item, language)} — ${localize(item.role, language)}`);
    lines.push("");
    lines.push(`\`${localize(item.period, language)}\``);
    lines.push("");
    lines.push(localize(item.summary, language));
    lines.push("");
    (localize(item.highlights, language) || []).forEach((highlight) => lines.push(`- ${highlight}`));
    lines.push("");
  });
  lines.push(`## ${copy.resumeSections.projects}`, "");
  projects.forEach((item) => {
    const link = item.url ? ` · [LIVE](${item.url})` : "";
    lines.push(`### ${localize(item.title, language)}${link}`, "", localize(item.summary, language), "");
    (localize(item.highlights, language) || []).forEach((highlight) => lines.push(`- ${highlight}`));
    lines.push("");
  });
  lines.push(`## ${copy.resumeSections.skills}`, "", skills.map((skill) => `\`${skill}\``).join(" · "), "");
  return lines.join("\n");
}

const itemMotion = {
  hidden: { opacity: 0, y: 26, filter: "blur(9px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.62, ease: [0.16, 0.78, 0.2, 1] } },
};

function LanguageControl({ language, onChange }) {
  return (
    <div className="tension-language" aria-label="Language">
      <button type="button" className={language === "zh" ? "is-active" : ""} onClick={() => onChange("zh")}>中</button>
      <span>/</span>
      <button type="button" className={language === "en" ? "is-active" : ""} onClick={() => onChange("en")}>EN</button>
    </div>
  );
}

function TensionHeader({ section, copy, language, onLanguageChange, onNavigate, onAdmin, menuOpen, setMenuOpen }) {
  return (
    <header className="tension-header">
      <button className="tension-brand" type="button" onClick={() => onNavigate("home")} aria-label="JEM home">
        <strong>JEM</strong><span>/ {copy.portfolio}</span>
      </button>
      <nav className="tension-nav" aria-label="Primary navigation">
        {SECTIONS.slice(1).map((id, index) => (
          <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => onNavigate(id)}>
            <small>{String(index + 1).padStart(2, "0")}</small><span>{copy.nav[id]}</span>
            {section === id && <motion.i layoutId="tension-nav-marker" />}
          </button>
        ))}
      </nav>
      <div className="tension-tools">
        <span className="tension-availability"><i />{copy.available}</span>
        <LanguageControl language={language} onChange={onLanguageChange} />
        {LOCAL_ADMIN_ENABLED && <button className="tension-admin" type="button" onClick={onAdmin} aria-label={copy.manager}><GearSix weight="bold" /></button>}
        <button className="tension-menu-trigger" type="button" onClick={() => setMenuOpen((value) => !value)} aria-label={copy.menu} aria-expanded={menuOpen} aria-controls="tension-mobile-navigation">
          {menuOpen ? <X weight="bold" /> : <List weight="bold" />}
        </button>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav id="tension-mobile-navigation" className="tension-mobile-menu" aria-label="Mobile navigation" initial={{ opacity: 0, clipPath: "circle(0% at 88% 7%)" }} animate={{ opacity: 1, clipPath: "circle(145% at 88% 7%)" }} exit={{ opacity: 0, clipPath: "circle(0% at 88% 7%)" }} transition={{ duration: 0.58, ease: [0.16, 0.82, 0.18, 1] }}>
            {SECTIONS.map((id, index) => (
              <button key={id} type="button" className={section === id ? "is-active" : ""} onClick={() => onNavigate(id)}>
                <small>{String(index).padStart(2, "0")}</small><strong>{copy.nav[id]}</strong><ArrowRight weight="bold" />
              </button>
            ))}
            <div><LanguageControl language={language} onChange={onLanguageChange} />{LOCAL_ADMIN_ENABLED && <button type="button" onClick={onAdmin}>{copy.manager}</button>}</div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function PageShell({ section, label, number, reducedMotion, children }) {
  return (
    <motion.section
      className={`tension-page tension-page--${section}`}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: "circle(0% at 66% 54%)", filter: "blur(14px)" }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, clipPath: "circle(145% at 66% 54%)", filter: "blur(0px)" }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: "circle(0% at 66% 54%)", filter: "blur(12px)" }}
      transition={{ duration: reducedMotion ? 0.15 : 0.74, ease: [0.16, 0.84, 0.18, 1] }}
    >
      <div className="tension-page-rail" aria-hidden="true"><span>{number}</span><i /><small>{label}</small></div>
      <motion.div className="tension-page-content" initial="hidden" animate="visible" variants={{ visible: { transition: { delayChildren: reducedMotion ? 0 : 0.14, staggerChildren: reducedMotion ? 0 : 0.065 } } }}>
        {children}
      </motion.div>
    </motion.section>
  );
}

function HomePage({ content, language, copy, onNavigate, reducedMotion }) {
  const current = content.experiences.filter((item) => item.published)[0];
  return (
    <PageShell section="home" label="ENTRY" number="00" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.homeKicker}</motion.p>
      <motion.h1 className="tension-home-title" variants={itemMotion}>
        {language === "zh" ? <><span>欢迎来到</span><span>我的空间。</span></> : <><span>Welcome to</span><span>my space.</span></>}
      </motion.h1>
      <motion.p className="tension-home-lead" variants={itemMotion}>{copy.homeLead}</motion.p>
      <motion.button className="tension-primary-action" variants={itemMotion} type="button" onClick={() => onNavigate("projects")}>
        <span>{copy.explore}</span><ArrowRight weight="bold" />
      </motion.button>
      {current && (
        <motion.button className="tension-current-role" variants={itemMotion} type="button" onClick={() => onNavigate("work")}>
          <small>{copy.current}</small><strong>{displayCompany(current, language)}</strong><span>{localize(current.role, language)}</span><b>{localize(current.period, language)}</b><ArrowUpRight weight="bold" />
        </motion.button>
      )}
      <motion.div className="tension-home-facts" variants={itemMotion}>
        <div><span>{copy.focus}</span><strong>{localize(content.profile.focus, language)}</strong></div>
        <div><span>{copy.location}</span><strong>{localize(content.profile.location, language)}</strong></div>
        <div><span>{copy.status}</span><strong>{localize(content.profile.availability, language)}</strong></div>
      </motion.div>
    </PageShell>
  );
}

function WorkPage({ experiences, language, copy, reducedMotion }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [details, setDetails] = useState(false);
  const active = experiences[activeIndex] || experiences[0];
  if (!active) return null;
  const cycle = (offset) => { setActiveIndex((activeIndex + offset + experiences.length) % experiences.length); setDetails(false); };
  return (
    <PageShell section="work" label={copy.nav.work} number="01" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.selectedExperience}</motion.p>
      <AnimatePresence mode="wait">
        <motion.article className="tension-work-feature" key={active.id} initial={{ opacity: 0, y: 20, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -16, filter: "blur(7px)" }} transition={{ duration: 0.54, ease: [0.16, 0.82, 0.18, 1] }}>
          <span>{localize(active.period, language)}</span>
          <h1>{displayCompany(active, language)}</h1>
          <h2>{localize(active.role, language)}</h2>
          <p>{localize(active.summary, language)}</p>
          <button type="button" onClick={() => setDetails((value) => !value)}>{details ? copy.back : copy.outcome}<ArrowRight weight="bold" /></button>
        </motion.article>
      </AnimatePresence>
      <motion.div className="tension-work-index" variants={itemMotion}>
        {experiences.map((item, index) => (
          <button key={item.id} type="button" className={activeIndex === index ? "is-active" : ""} onClick={() => { setActiveIndex(index); setDetails(false); }}>
            <small>{String(index + 1).padStart(2, "0")}</small><strong>{displayCompany(item, language)}</strong><span>{localize(item.period, language)}</span>
          </button>
        ))}
      </motion.div>
      <AnimatePresence>
        {details && (
          <motion.aside className="tension-work-details" initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }} exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }} transition={{ duration: 0.6, ease: [0.16, 0.82, 0.18, 1] }}>
            <span>{copy.outcome}</span>
            <ol>{(localize(active.highlights, language) || []).map((item) => <li key={item}>{item}</li>)}</ol>
            <div><span>{copy.tools}</span>{(localize(active.skills, language) || []).map((item) => <small key={item}>{item}</small>)}</div>
          </motion.aside>
        )}
      </AnimatePresence>
      <motion.footer className="tension-work-footer" variants={itemMotion}>
        <button type="button" onClick={() => cycle(-1)}><ArrowLeft weight="bold" /> {copy.previous}</button>
        <span>{String(activeIndex + 1).padStart(2, "0")} / {String(experiences.length).padStart(2, "0")}</span>
        <button type="button" onClick={() => cycle(1)}>{copy.next} <ArrowRight weight="bold" /></button>
      </motion.footer>
    </PageShell>
  );
}

function ProjectsPage({ projects, language, copy, reducedMotion }) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, projects.findIndex((item) => item.id === "project-web3-jobs")));
  const [activeMedia, setActiveMedia] = useState("jobs");
  const active = projects[activeIndex] || projects[0];
  if (!active) return null;
  const media = PROJECT_MEDIA[active.id] || [];
  const selectedMedia = media.find((item) => item.id === activeMedia) || media[0];
  const selectProject = (index) => {
    setActiveIndex(index);
    setActiveMedia(projects[index]?.id === "project-web3-jobs" ? "jobs" : "home");
  };
  return (
    <PageShell section="projects" label={copy.nav.projects} number="02" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.projectsLead}</motion.p>
      <motion.div className="tension-project-layout" variants={itemMotion}>
        <section className={`tension-project-visual ${media.length ? "has-media" : "is-private"}`}>
          <header><span>{copy.projectPreview}</span>{active.url && <a href={active.url} target="_blank" rel="noreferrer">{copy.openProject}<ArrowUpRight weight="bold" /></a>}</header>
          {selectedMedia ? (
            <>
              <AnimatePresence mode="wait">
                <motion.a className="tension-project-shot" key={selectedMedia.id} href={selectedMedia.url} target="_blank" rel="noreferrer" initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }} animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }} exit={{ opacity: 0, clipPath: "inset(100% 0 0 0)" }} transition={{ duration: reducedMotion ? 0.1 : 0.62, ease: [0.16, 0.82, 0.18, 1] }}>
                  <img src={selectedMedia.src} alt={`${localize(active.title, language)} — ${copy[selectedMedia.labelKey]}`} />
                  <span>{copy[selectedMedia.labelKey]}<ArrowUpRight weight="bold" /></span>
                </motion.a>
              </AnimatePresence>
              <nav aria-label={copy.projectPreview}>{media.map((item, index) => <button key={item.id} type="button" className={selectedMedia.id === item.id ? "is-active" : ""} onClick={() => setActiveMedia(item.id)}><small>{String(index + 1).padStart(2, "0")}</small><span>{copy[item.labelKey]}</span></button>)}</nav>
            </>
          ) : (
            <div className="tension-project-private"><Database weight="thin" /><span>{copy.privateProject}</span></div>
          )}
        </section>
        <AnimatePresence mode="wait">
          <motion.article className="tension-project-feature" key={active.id} initial={{ opacity: 0, x: 28, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -24, filter: "blur(8px)" }} transition={{ duration: 0.56, ease: [0.16, 0.82, 0.18, 1] }}>
            <span>{localize(active.kicker, language)}</span>
            <h1>{localize(active.title, language)}</h1>
            <p>{localize(active.summary, language)}</p>
            {active.id === "project-web3-jobs" && <div className="tension-project-source"><Database weight="bold" /><span>{copy.crawlerLabel}</span><strong>{copy.crawlerValue}</strong></div>}
            <div className="tension-project-tech">{(localize(active.tech, language) || []).map((item) => <small key={item}>{item}</small>)}</div>
            <ol>{(localize(active.highlights, language) || []).map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol>
          </motion.article>
        </AnimatePresence>
      </motion.div>
      <motion.div className="tension-project-index" variants={itemMotion}>
        {projects.map((item, index) => (
          <button key={item.id} type="button" className={activeIndex === index ? "is-active" : ""} onClick={() => selectProject(index)}>
            <small>{String(index + 1).padStart(2, "0")}</small><strong>{localize(item.title, language)}</strong><span>{localize(item.kicker, language)}</span><ArrowRight weight="bold" />
          </button>
        ))}
      </motion.div>
    </PageShell>
  );
}

function ResumePage({ content, language, copy, reducedMotion }) {
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(() => buildResumeMarkdown(content, language, copy), [content, language, copy]);
  const experiences = content.experiences.filter((item) => item.published);
  const projects = content.projects.filter((item) => item.published);
  const skills = [...new Set([
    ...experiences.flatMap((item) => localize(item.skills, language) || []),
    ...projects.flatMap((item) => localize(item.tech, language) || []),
  ])];

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const input = document.createElement("textarea");
      input.value = markdown;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `jem-resume-${language}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell section="resume" label={copy.nav.resume} number="03" reducedMotion={reducedMotion}>
      <motion.header className="tension-resume-header" variants={itemMotion}>
        <div><p className="tension-kicker">{copy.resumeKicker}</p><h1>resume<span>.md</span></h1><p>{copy.resumeLead}</p></div>
        <div className="tension-resume-actions">
          <button type="button" onClick={copyMarkdown}>{copied ? <Check weight="bold" /> : <Copy weight="bold" />}<span>{copied ? copy.resumeCopied : copy.resumeCopy}</span></button>
          <button type="button" onClick={downloadMarkdown}><DownloadSimple weight="bold" /><span>{copy.resumeDownload}</span></button>
        </div>
      </motion.header>
      <motion.div className="tension-resume-layout" variants={itemMotion}>
        <aside>
          <span>README / JEM</span>
          {Object.entries(copy.resumeSections).map(([id, label], index) => <a key={id} href={`#resume-${id}`}><small>{String(index + 1).padStart(2, "0")}</small>{label}</a>)}
        </aside>
        <article className="tension-resume-document">
          <section id="resume-profile" className="resume-profile">
            <h2><span>#</span> JEM</h2>
            <blockquote>{localize(content.profile.headline, language)}</blockquote>
            <p>{localize(content.profile.intro, language)}</p>
            <div className="resume-inline-links"><a href={`mailto:${content.profile.email}`}>{content.profile.email}</a><a href={content.profile.github} target="_blank" rel="noreferrer">github.com/Guuu16</a></div>
          </section>
          <section id="resume-experience">
            <h3><span>##</span> {copy.resumeSections.experience}</h3>
            {experiences.map((item) => <article key={item.id}><header><h4>{displayCompany(item, language)} <span>— {localize(item.role, language)}</span></h4><code>{localize(item.period, language)}</code></header><p>{localize(item.summary, language)}</p><ul>{(localize(item.highlights, language) || []).map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></article>)}
          </section>
          <section id="resume-projects">
            <h3><span>##</span> {copy.resumeSections.projects}</h3>
            {projects.map((item) => <article key={item.id}><header><h4>{localize(item.title, language)}</h4>{item.url && <a href={item.url} target="_blank" rel="noreferrer">LIVE <ArrowUpRight weight="bold" /></a>}</header><p>{localize(item.summary, language)}</p></article>)}
          </section>
          <section id="resume-skills">
            <h3><span>##</span> {copy.resumeSections.skills}</h3>
            <div className="resume-skills">{skills.map((skill) => <code key={skill}>{skill}</code>)}</div>
          </section>
        </article>
      </motion.div>
    </PageShell>
  );
}

function NotesPage({ notes, language, copy, reducedMotion }) {
  const [query, setQuery] = useState("");
  const [readingId, setReadingId] = useState(null);
  const filtered = useMemo(() => notes.filter((note) => `${localize(note.title, language)} ${localize(note.tag, language)}`.toLowerCase().includes(query.toLowerCase())), [language, notes, query]);
  const reading = notes.find((note) => note.id === readingId);
  return (
    <PageShell section="notes" label={copy.nav.notes} number="04" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.notesLead}</motion.p>
      <motion.div className="tension-notes-top" variants={itemMotion}>
        <h1>{copy.nav.notes}</h1>
        <label><MagnifyingGlass weight="bold" /><input value={query} onChange={(event) => { setQuery(event.target.value); setReadingId(null); }} placeholder={copy.search} /></label>
      </motion.div>
      <AnimatePresence mode="wait">
        {reading ? (
          <motion.article className="tension-note-reader" key={reading.id} initial={{ opacity: 0, clipPath: "circle(0% at 66% 54%)" }} animate={{ opacity: 1, clipPath: "circle(140% at 66% 54%)" }} exit={{ opacity: 0, clipPath: "circle(0% at 66% 54%)" }} transition={{ duration: 0.62, ease: [0.16, 0.82, 0.18, 1] }}>
            <span>{reading.date} / {localize(reading.tag, language)}</span>
            <h2>{localize(reading.title, language)}</h2>
            <strong>{localize(reading.excerpt, language)}</strong>
            <p>{localize(reading.content, language)}</p>
            <button type="button" onClick={() => setReadingId(null)}><ArrowLeft weight="bold" /> {copy.back}</button>
          </motion.article>
        ) : (
          <motion.div className="tension-notes-list" key="notes-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.map((note, index) => (
              <button key={note.id} type="button" onClick={() => setReadingId(note.id)}>
                <small>{note.date}</small><strong>{localize(note.title, language)}</strong><span>{localize(note.tag, language)}</span><b>{copy.read}</b><ArrowUpRight weight="bold" />
              </button>
            ))}
            {!filtered.length && <p>{copy.empty}</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}

function AboutPage({ content, language, copy, reducedMotion, onNavigate }) {
  return (
    <PageShell section="about" label={copy.nav.about} number="05" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.profile}</motion.p>
      <motion.h1 className="tension-about-title" variants={itemMotion}>JEM</motion.h1>
      <motion.p className="tension-about-intro" variants={itemMotion}>{localize(content.profile.intro, language)}</motion.p>
      <motion.div className="tension-about-facts" variants={itemMotion}>
        <div><span>{copy.focus}</span><strong>{localize(content.profile.focus, language)}</strong></div>
        <div><span>{copy.tools}</span><strong>{localize(content.profile.medium, language)}</strong></div>
        <div><span>{copy.location}</span><strong>{localize(content.profile.location, language)}</strong></div>
      </motion.div>
      <motion.div className="tension-about-columns tension-about-columns--single" variants={itemMotion}>
        <section className="tension-about-approach"><span>{copy.approach}</span><p>{copy.approachText}</p><button type="button" onClick={() => onNavigate("contact")}>{copy.nav.contact}<ArrowRight weight="bold" /></button></section>
      </motion.div>
    </PageShell>
  );
}

function ContactPage({ profile, copy, reducedMotion }) {
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
    <PageShell section="contact" label={copy.nav.contact} number="06" reducedMotion={reducedMotion}>
      <motion.p className="tension-kicker" variants={itemMotion}>{copy.available}</motion.p>
      <motion.div className="tension-contact-layout" variants={itemMotion}>
        <div className="tension-contact-intro">
          <h1 className="tension-contact-title">{copy.contactTitle}</h1>
          <p className="tension-contact-lead">{copy.contactLead}</p>
          <div className="tension-contact-channels">
            <a href={`mailto:${profile.email}`}><span><GlobeSimple weight="bold" />{copy.email}</span><strong>{profile.email}</strong><ArrowUpRight weight="bold" /></a>
            <a href={profile.github} target="_blank" rel="noreferrer"><span><GithubLogo weight="bold" />{copy.github}</span><strong>github.com/Guuu16</strong><ArrowUpRight weight="bold" /></a>
          </div>
        </div>
        <div className="tension-contact-compose">
          <form className="tension-contact-form" onSubmit={submit}>
            <label htmlFor="tension-contact-name"><span>{copy.name}</span><input id="tension-contact-name" name="name" autoComplete="name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
            <label htmlFor="tension-contact-email"><span>{copy.email}</span><input id="tension-contact-email" name="email" autoComplete="email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="is-wide" htmlFor="tension-contact-message"><span>{copy.message}</span><textarea id="tension-contact-message" name="message" rows="5" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label>
            <button type="submit"><span>{copy.send}</span><ArrowUpRight weight="bold" /></button>
          </form>
          <AnimatePresence>{sent && <motion.div className="tension-contact-success" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><CheckCircle weight="fill" /><div><strong>{copy.sent}</strong><span>{copy.sentHelp}</span></div></motion.div>}</AnimatePresence>
        </div>
      </motion.div>
    </PageShell>
  );
}

export function TensionPortfolio({ content, navigate, pathname, language, onLanguageChange }) {
  const copy = COPY[language] || COPY.zh;
  const reducedMotion = useReducedMotion();
  const section = sectionFromPath(pathname);
  const [entered, setEntered] = useState(() => {
    const forceCoverPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).get("cover") === "1";
    return forceCoverPreview ? false : section !== "home" || sessionStorage.getItem("jem-tension-entered-v3") === "1";
  });
  const [pending, setPending] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signalMode, setSignalMode] = useState(false);
  const timer = useRef(0);
  const konami = useRef([]);
  const experiences = content.experiences.filter((item) => item.published);
  const projects = content.projects.filter((item) => item.published);
  const notes = content.notes.filter((item) => item.published);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onNavigate = useCallback((next) => {
    if (!SECTIONS.includes(next) || next === (pending || section)) return;
    window.clearTimeout(timer.current);
    setPending(next);
    setMenuOpen(false);
    const path = next === "home" ? "/" : `/${next}`;
    timer.current = window.setTimeout(() => {
      navigate(path);
      setPending(null);
    }, reducedMotion ? 0 : 90);
  }, [navigate, pending, reducedMotion, section]);

  useEffect(() => {
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    const onKey = (event) => {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) return;
      konami.current = [...konami.current, event.key].slice(-sequence.length);
      if (konami.current.join("|").toLowerCase() === sequence.join("|").toLowerCase()) setSignalMode(true);
      if (entered && event.key >= "1" && event.key <= "6") onNavigate(SECTIONS[Number(event.key)]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entered, onNavigate]);

  const activeSection = pending || section;

  return (
    <LayoutGroup>
      <main className={`tension-shell ${entered ? "is-entered" : "is-covered"} ${signalMode ? "is-signal" : ""}`}>
        <div className="tension-archive" aria-hidden={!entered}>
          <TensionHeader section={activeSection} copy={copy} language={language} onLanguageChange={onLanguageChange} onNavigate={onNavigate} onAdmin={LOCAL_ADMIN_ENABLED ? () => navigate("/admin") : undefined} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
          <div className="tension-ambient-word" aria-hidden="true">JEM</div>
          <AnimatePresence mode="wait" initial={false}>
            {section === "home" && <HomePage key="home" content={content} language={language} copy={copy} onNavigate={onNavigate} reducedMotion={reducedMotion} />}
            {section === "work" && <WorkPage key="work" experiences={experiences} language={language} copy={copy} reducedMotion={reducedMotion} />}
            {section === "projects" && <ProjectsPage key="projects" projects={projects} language={language} copy={copy} reducedMotion={reducedMotion} />}
            {section === "resume" && <ResumePage key="resume" content={content} language={language} copy={copy} reducedMotion={reducedMotion} />}
            {section === "notes" && <NotesPage key="notes" notes={notes} language={language} copy={copy} reducedMotion={reducedMotion} />}
            {section === "about" && <AboutPage key="about" content={content} language={language} copy={copy} reducedMotion={reducedMotion} onNavigate={onNavigate} />}
            {section === "contact" && <ContactPage key="contact" profile={content.profile} copy={copy} reducedMotion={reducedMotion} />}
          </AnimatePresence>
          <button className="tension-signal" type="button" onClick={() => setSignalMode((value) => !value)}><span>{signalMode ? copy.signalActive : copy.signal}</span><strong>03:17</strong></button>
        </div>
        <AnimatePresence>{!entered && <motion.div className="tension-cover-layer" exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0.18 : 0.46 }}><Suspense fallback={<div className="tension-cover-loading" aria-label="Loading portfolio entrance"><picture className="tension-cover-picture"><source media="(max-width: 720px)" srcSet="/assets/tension/tension-cover-mobile.png" /><img src="/assets/tension/tension-cover-desktop.png" alt="JEM letters pressed into a stretched monochrome fabric membrane" /></picture></div>}><TensionCover language={language} onComplete={() => { sessionStorage.setItem("jem-tension-entered-v3", "1"); setEntered(true); }} /></Suspense></motion.div>}</AnimatePresence>
      </main>
    </LayoutGroup>
  );
}
