import { useCallback, useEffect, useMemo, useState } from "react";

export const STORAGE_KEY = "jem-studio-content-v3";
const LEGACY_STORAGE_KEY = "jem-studio-content-v2";
export const LANGUAGE_KEY = "jem-studio-language-v2";

const dual = (zh, en) => ({ zh, en });

export const seedContent = {
  schemaVersion: 3,
  profile: {
    name: "JEM",
    headline: dual("测试开发工程师", "TEST DEVELOPMENT ENGINEER"),
    statement: dual("我构建可靠的系统。", "I BUILD RELIABLE SYSTEMS."),
    intro: dual(
      "测试开发工程师，专注于芯片软件工具链、CI/CD、自动化测试平台与 AI 辅助质量工程。擅长把复杂验证流程整理成稳定、可观测、可持续演进的工程系统。",
      "Test development engineer focused on chip software toolchains, CI/CD, automation platforms and AI-assisted quality engineering. I turn complex validation flows into reliable, observable systems that teams can evolve with confidence.",
    ),
    focus: dual("芯片工具链与质量平台", "CHIP TOOLCHAINS + QUALITY PLATFORMS"),
    medium: dual("Python / C++ / CI/CD / AI", "PYTHON / C++ / CI/CD / AI"),
    location: dual("中国 · 上海", "SHANGHAI, CHINA"),
    availability: dual("在职", "CURRENTLY EMPLOYED"),
    email: "gujie1016@gmail.com",
    github: "https://github.com/Guuu16",
  },
  experiences: [
    {
      id: "exp-united-imaging",
      company: dual("上海联影医疗科技有限公司", "UNITED IMAGING HEALTHCARE"),
      role: dual("测试开发 · RT", "TEST DEVELOPMENT · RT"),
      period: dual("2026.06 — 至今", "JUN 2026 — PRESENT"),
      summary: dual(
        "负责 RT 产品线跨平台编译打包、持续集成与交付，以及研发协作自动化，保障每日稳定出包与多环境发布。",
        "Own cross-platform packaging, continuous integration and delivery, and developer collaboration automation for the RT product line, supporting stable daily builds and multi-environment releases.",
      ),
      highlights: dual(
        [
          "维护跨平台编译打包环境，优化依赖管理与构建脚本。",
          "搭建并维护从代码提交到部署的 CI/CD 流水线，支持灰度发布与快速回滚。",
          "开发接入 Hermes 的飞书机器人，实时推送构建、部署和质量状态，并支持交互式查询与构建触发。",
        ],
        [
          "Maintain cross-platform build and packaging environments while improving dependency management and build scripts.",
          "Build and operate CI/CD pipelines from commit to deployment with staged releases and rapid rollback.",
          "Develop a Feishu bot integrated with Hermes for real-time build, deployment and quality updates, interactive queries and build triggers.",
        ],
      ),
      skills: dual(
        ["CI/CD", "跨平台构建", "飞书机器人", "Hermes"],
        ["CI/CD", "CROSS-PLATFORM BUILDS", "FEISHU BOT", "HERMES"],
      ),
      published: true,
    },
    {
      id: "exp-xpeng",
      company: dual("小鹏汽车", "XPENG"),
      role: dual("测试开发 · 芯片软件工具链", "TEST DEVELOPMENT · CHIP SOFTWARE TOOLCHAIN"),
      period: dual("2025.05 — 2026.05", "MAY 2025 — MAY 2026"),
      summary: dual(
        "主导从 ONNX 模型输入到自研芯片板端推理的端到端验证体系，覆盖前端解析、中端优化、后端代码生成、CModel 仿真与实体板卡。",
        "Led end-to-end validation from ONNX model input to inference on a proprietary chip, spanning frontend parsing, IR optimisation, backend code generation, CModel simulation and physical boards.",
      ),
      highlights: dual(
        [
          "基于 GitLab CI 构建五阶段全链路流水线，并按变更模块自动选择构建与回归路径，单次 CI 耗时降低 60%，无效执行减少约 70%。",
          "通过并行编译、Pytest-xdist 与多节点 Runner，将全量回归从约 3 小时压缩至 1 小时以内。",
          "构建 Codegen / DSL / ASM 算子功能与精度验证体系，结合 Golden Data、CModel 与板端 E2E 测试形成多层质量门禁。",
          "搭建 AI 测试用例生成与 Bug 分析工具，边界场景覆盖率达到 90%，平均 Bug 定位时间从 2 小时缩短至 0.5 小时。",
          "通过 MCP 服务连接验证系统与飞书，测试失败后自动创建带日志、堆栈和 AI 初步分析的工单。",
        ],
        [
          "Built a five-stage GitLab CI pipeline with change-aware build and regression paths, cutting CI duration by 60% and unnecessary runs by about 70%.",
          "Reduced full regression from roughly three hours to under one hour through parallel compilation, Pytest-xdist and multi-node runners.",
          "Created layered functional and numerical validation for Codegen, DSL and ASM operators using Golden Data, CModel simulation and board-level E2E tests.",
          "Built AI-assisted test generation and bug analysis tools, reaching 90% boundary-scenario coverage and reducing average bug localisation from two hours to 0.5 hours.",
          "Connected the validation system to Feishu through MCP so failures automatically create tickets with logs, stack traces and an initial AI analysis.",
        ],
      ),
      skills: dual(
        ["ONNX", "C++", "Python", "GitLab CI", "CMake", "Pytest", "Docker", "CModel", "MCP"],
        ["ONNX", "C++", "PYTHON", "GITLAB CI", "CMAKE", "PYTEST", "DOCKER", "CMODEL", "MCP"],
      ),
      published: true,
    },
    {
      id: "exp-kingdom",
      company: dual("深圳市金证科技股份有限公司", "SHENZHEN KINGDOM TECHNOLOGY"),
      role: dual("测试开发", "TEST DEVELOPMENT ENGINEER"),
      period: dual("2021.03 — 2024.04", "MAR 2021 — APR 2024"),
      summary: dual(
        "独立主导自动化测试平台的全栈设计与开发，将服务器管理、测试调度、缺陷闭环和质量可视化整合为跨团队的一站式工具。",
        "Independently led full-stack design and development of an automation platform combining server management, test orchestration, defect workflows and quality visualisation for multiple teams.",
      ),
      highlights: dual(
        [
          "平台被多个团队采用，整体测试效率提升 30%。",
          "使用 Django REST Framework 构建五类 RESTful API，并集成 Jenkins、TestLink、JIRA、Nexus、SonarQube 与 LDAP。",
          "通过脚本化部署将环境准备从 2 小时缩短至 1 小时；通过 Jenkins 节点分流将全量回归从 4 小时压缩至 1.2 小时。",
          "使用 Docker 隔离执行环境，并通过 Vue.js、ECharts、Allure 与定制 Dashboard 展示质量趋势。",
        ],
        [
          "The platform was adopted by multiple teams and improved overall testing efficiency by 30%.",
          "Built five groups of RESTful APIs with Django REST Framework and integrated Jenkins, TestLink, JIRA, Nexus, SonarQube and LDAP.",
          "Cut environment preparation from two hours to one through scripted deployment, and reduced full regression from four hours to 1.2 hours through Jenkins node routing.",
          "Isolated execution environments with Docker and visualised quality trends through Vue.js, ECharts, Allure and a customised dashboard.",
        ],
      ),
      skills: dual(
        ["Django REST Framework", "Jenkins", "Docker", "Vue.js", "ECharts", "MySQL", "Redis"],
        ["DJANGO REST FRAMEWORK", "JENKINS", "DOCKER", "VUE.JS", "ECHARTS", "MYSQL", "REDIS"],
      ),
      published: true,
    },
  ],
  education: [
    {
      id: "edu-inti",
      school: dual("英迪国际大学", "INTI INTERNATIONAL UNIVERSITY"),
      degree: dual("信息系统硕士 · 计算机学院", "MASTER OF INFORMATION SYSTEMS · SCHOOL OF COMPUTING"),
      period: dual("2024.03 — 2025.04", "MAR 2024 — APR 2025"),
      published: true,
    },
    {
      id: "edu-lixin",
      school: dual("上海立信会计金融学院", "SHANGHAI LIXIN UNIVERSITY OF ACCOUNTING AND FINANCE"),
      degree: dual("金融学学士 · 金融系", "BACHELOR OF FINANCE · DEPARTMENT OF FINANCE"),
      period: dual("2016.09 — 2020.07", "SEP 2016 — JUL 2020"),
      published: true,
    },
  ],
  notes: [
    {
      id: "note-quality-gates",
      title: dual("把质量门禁放在反馈最短的地方", "Put quality gates where feedback is fastest"),
      excerpt: dual(
        "越早定位错误，修复成本越低；好的流水线会让正确的检查自动靠近对应的变更。",
        "The earlier a defect is located, the cheaper it is to fix. A good pipeline automatically brings the right checks close to each change.",
      ),
      content: dual(
        "模块级差异化 CI 的核心不是少跑测试，而是让每次变更先获得最相关、最快速的反馈，再在需要时升级到跨模块回归。速度和质量并不冲突，前提是路径选择足够准确。",
        "Change-aware CI is not about running fewer tests. It gives every change the fastest relevant feedback first, then escalates to cross-module regression when needed. Speed and quality align when routing is precise.",
      ),
      tag: dual("质量工程", "QUALITY ENGINEERING"),
      date: "2026-07-18",
      published: true,
    },
    {
      id: "note-ai-debugging",
      title: dual("AI 调试应该先给证据，再给结论", "AI debugging should show evidence before conclusions"),
      excerpt: dual(
        "自动分析的价值，不是猜得更快，而是把日志、堆栈和可疑代码组织成一条可验证的路径。",
        "The value of automated analysis is not faster guessing, but organising logs, stack traces and suspicious code into a path that can be verified.",
      ),
      content: dual(
        "当智能体能够调用调试器并保留每一步证据时，工程师可以迅速判断推理是否可靠。工具应该缩短定位路径，同时保留人的最终判断权。",
        "When an agent can call a debugger and retain evidence for every step, engineers can quickly judge whether its reasoning is sound. The tool should shorten the diagnostic path while leaving the final decision with the human.",
      ),
      tag: dual("AI 工程", "AI ENGINEERING"),
      date: "2026-06-27",
      published: true,
    },
    {
      id: "note-observability",
      title: dual("自动化系统必须可观测", "Automation must remain observable"),
      excerpt: dual(
        "无人值守并不等于不可见；状态、失败原因和下一步都应该随时能够被理解。",
        "Unattended operation should never mean invisible operation. State, failure reasons and the next action must remain understandable.",
      ),
      content: dual(
        "我更愿意把报告、通知和可回滚能力视为自动化的一部分，而不是上线后的补充。系统越复杂，越需要让每个阶段都留下清晰、可追踪的信号。",
        "I treat reporting, notifications and rollback as part of automation, not additions after launch. The more complex the system, the more each stage needs to leave a clear, traceable signal.",
      ),
      tag: dual("系统设计", "SYSTEM DESIGN"),
      date: "2026-05-09",
      published: true,
    },
  ],
  projects: [
    {
      id: "project-web-portal",
      title: dual("Web Portal 平台", "WEB PORTAL PLATFORM"),
      kicker: dual("测试管理 / CI 平台", "TEST MANAGEMENT / CI PLATFORM"),
      summary: dual(
        "跨团队的一站式测试管理入口，统一整合 TestLink、Bugzilla、Jenkins、LDAP 与 Nexus。采用 Django REST Framework、MySQL、Redis、Vue.js 与 ECharts，实现用例、构建、缺陷、制品和服务器状态的统一管理；交付后测试与交付效率提升约 30%，人为操作失误率降低 80%。",
        "A cross-team test management portal unifying TestLink, Bugzilla, Jenkins, LDAP and Nexus. Built with Django REST Framework, MySQL, Redis, Vue.js and ECharts to manage cases, builds, defects, artefacts and server status in one place; after delivery, test and release efficiency improved by about 30% while manual errors fell by 80%.",
      ),
      highlights: dual(
        [
          "插件化 Adapter 层封装外部系统 API，便于扩展与替换。",
          "Redis 缓存热点构建状态与看板指标，响应速度缩短 30%。",
          "版本构建全量归档，回归构建按变更范围自动筛选测试集。",
        ],
        [
          "A plugin-style adapter layer isolated external APIs for easier extension and replacement.",
          "Redis cached build status and dashboard aggregates, reducing response time by 30%.",
          "Release builds were fully archived while regression builds selected tests from the change scope.",
        ],
      ),
      tech: dual(
        ["Django REST Framework", "MySQL", "Redis", "Jenkins", "Vue.js", "ECharts"],
        ["DJANGO REST FRAMEWORK", "MYSQL", "REDIS", "JENKINS", "VUE.JS", "ECHARTS"],
      ),
      url: "",
      published: true,
    },
    {
      id: "project-web3-jobs",
      title: dual("Web3 招聘平台", "WEB3 JOBS PLATFORM"),
      kicker: dual("数据采集 / 清洗 / 可视化", "DATA COLLECTION / CLEANING / VISUALISATION"),
      summary: dual(
        "独立完成多源职位数据采集、清洗、存储与前端展示，累计构建 5 万余条有效职位数据。使用 Scrapy、MySQL、大语言模型、Vue.js 与 ECharts，将异构职位描述转化为可筛选、可分析的结构化数据。",
        "Independently built the full pipeline from multi-source job collection and cleaning to storage and frontend visualisation, producing more than 50,000 valid records. Scrapy, MySQL, language models, Vue.js and ECharts transformed heterogeneous descriptions into structured, searchable data.",
      ),
      highlights: dual(
        [
          "多站点分布式爬虫稳定采集率达到 98%。",
          "通过 LLM 语义清洗和质量校验，结构化字段准确率达到 95%。",
          "支持按技术栈、薪资区间、工作模式与来源平台进行筛选和对比分析。",
        ],
        [
          "The multi-site distributed crawler achieved a 98% stable collection rate.",
          "LLM-assisted semantic cleaning plus validation reached 95% structured-field accuracy.",
          "Users could filter and compare roles by technology, salary range, work mode and source platform.",
        ],
      ),
      tech: dual(
        ["Scrapy", "Python", "MySQL", "LLM", "Vue.js", "ECharts"],
        ["SCRAPY", "PYTHON", "MYSQL", "LLM", "VUE.JS", "ECHARTS"],
      ),
      url: "https://cryptosquare.org/jobs?lng=zh-CN",
      published: true,
    },
  ],
};

const LOCALIZED_FIELDS = {
  profile: ["headline", "statement", "intro", "focus", "medium", "location", "availability"],
  experiences: ["company", "role", "period", "summary", "highlights", "skills"],
  education: ["school", "degree", "period"],
  notes: ["title", "excerpt", "content", "tag"],
  projects: ["title", "kicker", "summary", "highlights", "tech"],
};

const ARRAY_FIELDS = new Set(["highlights", "skills", "tech"]);
const LEGACY_DEMO_IDS = new Set([
  "exp-independent",
  "exp-lab",
  "project-spatial-portfolio",
  "project-agent-notebook",
  "project-signal-field",
]);

function normalizeLocalizedValue(value, fallback, isArray = false) {
  const empty = isArray ? [] : "";
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      zh: value.zh ?? value.en ?? fallback?.zh ?? fallback?.en ?? empty,
      en: value.en ?? value.zh ?? fallback?.en ?? fallback?.zh ?? empty,
    };
  }
  if (value !== undefined && value !== null) return { zh: value, en: value };
  return { zh: fallback?.zh ?? fallback?.en ?? empty, en: fallback?.en ?? fallback?.zh ?? empty };
}

function normalizeEntry(section, entry, fallback = {}) {
  const merged = { ...fallback, ...(entry || {}) };
  for (const field of LOCALIZED_FIELDS[section] || []) {
    merged[field] = normalizeLocalizedValue(entry?.[field], fallback?.[field], ARRAY_FIELDS.has(field));
  }
  if (section === "projects" && !merged.url && fallback.url) merged.url = fallback.url;
  merged.published = Boolean(entry?.published ?? fallback?.published);
  return merged;
}

function normalizeContent(value) {
  const profile = { ...seedContent.profile, ...(value?.profile || {}), name: "JEM" };
  for (const field of LOCALIZED_FIELDS.profile) {
    profile[field] = normalizeLocalizedValue(value?.profile?.[field], seedContent.profile[field]);
  }

  return {
    schemaVersion: 3,
    profile,
    experiences: (Array.isArray(value?.experiences) ? value.experiences : seedContent.experiences)
      .map((entry) => normalizeEntry("experiences", entry)),
    education: (Array.isArray(value?.education) ? value.education : seedContent.education)
      .map((entry) => normalizeEntry("education", entry)),
    notes: (Array.isArray(value?.notes) ? value.notes : seedContent.notes)
      .map((entry) => normalizeEntry("notes", entry)),
    projects: (Array.isArray(value?.projects) ? value.projects : seedContent.projects)
      .map((entry) => normalizeEntry(
        "projects",
        entry,
        seedContent.projects.find((seed) => seed.id === entry?.id),
      )),
  };
}

function migrateLegacyContent(value) {
  const customExperiences = Array.isArray(value?.experiences)
    ? value.experiences.filter((item) => !LEGACY_DEMO_IDS.has(item.id) && !seedContent.experiences.some((seed) => seed.id === item.id))
    : [];
  const customProjects = Array.isArray(value?.projects)
    ? value.projects.filter((item) => !LEGACY_DEMO_IDS.has(item.id) && !seedContent.projects.some((seed) => seed.id === item.id))
    : [];
  const customNotes = Array.isArray(value?.notes)
    ? value.notes.filter((item) => seedContent.notes.some((seed) => seed.id === item.id))
    : [];

  return normalizeContent({
    ...seedContent,
    profile: {
      ...seedContent.profile,
      email: value?.profile?.email && value.profile.email !== "hello@example.com"
        ? value.profile.email
        : seedContent.profile.email,
    },
    experiences: [...seedContent.experiences, ...customExperiences],
    projects: [...seedContent.projects, ...customProjects],
    notes: customNotes.length ? customNotes : seedContent.notes,
  });
}

function readContent() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeContent(JSON.parse(stored));
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    return legacy ? migrateLegacyContent(JSON.parse(legacy)) : normalizeContent(seedContent);
  } catch {
    return normalizeContent(seedContent);
  }
}

export function localize(value, language = "zh") {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value[language] ?? value.zh ?? value.en ?? "";
  }
  return value ?? "";
}

export function updateLocalizedValue(value, language, nextValue) {
  const current = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : { zh: value ?? "", en: value ?? "" };
  return { ...current, [language]: nextValue };
}

export function useContentStore() {
  const [content, setContentState] = useState(readContent);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeContent(content)));
  }, [content]);

  const setContent = useCallback((value) => {
    setContentState((current) => normalizeContent(typeof value === "function" ? value(current) : value));
  }, []);

  const updateSection = useCallback((section, value) => {
    setContentState((current) => normalizeContent({ ...current, [section]: value }));
  }, []);

  const reset = useCallback(() => setContentState(normalizeContent(seedContent)), []);

  return useMemo(
    () => ({ content, setContent, updateSection, reset }),
    [content, setContent, updateSection, reset],
  );
}

export function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sanitizeImportedContent(value) {
  return normalizeContent(value);
}
