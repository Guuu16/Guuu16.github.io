export const MOTION_TIMINGS = Object.freeze({
  referenceWipe: 640,
  sceneUiReveal: 680,
  enterSettle: 1350,
  towerUnlock: 1120,
  directPanelReveal: 1260,
  directChapterSettle: 1760,
  chapterSwap: 280,
  chapterPanelReveal: 980,
  chapterTravelSettle: 1420,
  chapterExit: 560,
  returnRevealDelay: 580,
  returnSettle: 1320,
});

const ZONE_IDS = new Set(["work", "notes", "about", "contact"]);

export function getZoneSelectionMode({ zone, entered, sceneReady, activeZone }) {
  if (!ZONE_IDS.has(zone)) return "invalid";
  if (entered && sceneReady && activeZone === zone) return "noop";
  if (!entered || !sceneReady) return "from-reference";
  return "in-scene";
}

export function getReturnMode({ entered, activeZone, inTransit }) {
  if (!entered && activeZone === "home" && !inTransit) return "noop";
  return activeZone === "home" ? "direct" : "from-chapter";
}
