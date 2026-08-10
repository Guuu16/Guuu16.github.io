import assert from "node:assert/strict";
import test from "node:test";
import { getReturnMode, getZoneSelectionMode, MOTION_TIMINGS } from "../src/scene-transitions.js";

test("ignores invalid and repeated destination clicks", () => {
  assert.equal(getZoneSelectionMode({ zone: "unknown", entered: false, sceneReady: false, activeZone: "home" }), "invalid");
  assert.equal(getZoneSelectionMode({ zone: "work", entered: true, sceneReady: true, activeZone: "work" }), "noop");
});

test("sequences home navigation through the reference wipe", () => {
  assert.equal(getZoneSelectionMode({ zone: "notes", entered: false, sceneReady: false, activeZone: "home" }), "from-reference");
  assert.equal(getZoneSelectionMode({ zone: "about", entered: true, sceneReady: false, activeZone: "home" }), "from-reference");
  assert.ok(MOTION_TIMINGS.sceneUiReveal >= MOTION_TIMINGS.referenceWipe);
  assert.ok(MOTION_TIMINGS.directChapterSettle > MOTION_TIMINGS.sceneUiReveal);
});

test("switches live destinations without replaying the entry wipe", () => {
  assert.equal(getZoneSelectionMode({ zone: "contact", entered: true, sceneReady: true, activeZone: "work" }), "in-scene");
});

test("returns home only when there is an active scene or transition", () => {
  assert.equal(getReturnMode({ entered: false, activeZone: "home", inTransit: false }), "noop");
  assert.equal(getReturnMode({ entered: true, activeZone: "home", inTransit: false }), "direct");
  assert.equal(getReturnMode({ entered: true, activeZone: "notes", inTransit: true }), "from-chapter");
  assert.ok(MOTION_TIMINGS.returnRevealDelay >= MOTION_TIMINGS.chapterExit);
});
