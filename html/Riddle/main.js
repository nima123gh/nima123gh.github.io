/* =========================================================
   main.js
   The conductor. Holds no rendering logic of its own — just
   walks through Story data, asking UI to show each scene in
   turn, and keeps localStorage roughly in sync so a reload
   can pick the story back up.
   ========================================================= */

(function main() {
  let restarting = false;

  function restartJourney() {
    if (restarting) return;
    restarting = true;
    Utils.clearProgress();
    window.location.reload();
  }

  async function run() {
    UI.init({ restartCallback: restartJourney });
    UI.startAtmosphere();

    const totalTimelines = Story.timelineCount();
    const saved = Utils.loadProgress();

    // The story is now a tree: knowing "how deep" someone got isn't
    // enough to know *where* they are, since different choices lead
    // to different nodes at the same depth. So we also save which
    // choice was made at each step, and replay them on load to land
    // back on the exact same node.
    const hasValidShape = saved &&
      Number.isInteger(saved.timelineIndex) &&
      saved.timelineIndex > 0 &&
      saved.timelineIndex <= totalTimelines &&
      Array.isArray(saved.choices) &&
      saved.choices.length === saved.timelineIndex;
    const resumed = hasValidShape && Story.restorePath(saved.choices);
    const startIndex = resumed ? saved.timelineIndex : 0;
    const choicesMade = resumed ? saved.choices.slice() : [];

    let sceneNumber = 1;

    if (startIndex === 0) {
      UI.updateProgress(0, 1);
      await UI.showOpening();
    } else {
      sceneNumber = Math.min(1 + startIndex * 2 + 1, Story.totalSceneCount());
      UI.updateProgress(Math.min(startIndex, totalTimelines - 1), sceneNumber);
      await UI.showResumeNotice();
    }

    for (let i = startIndex; i < totalTimelines; i++) {
      const timeline = Story.getTimeline(i);

      sceneNumber = 1 + i * 2 + 1;
      UI.updateProgress(i, sceneNumber);
      const choiceIndex = await UI.showTimelinePrompt(timeline);

      sceneNumber = 1 + i * 2 + 2;
      UI.updateProgress(i, sceneNumber);
      await UI.showOutcome(timeline, choiceIndex);

      Story.advance(i, choiceIndex);
      choicesMade.push(choiceIndex);
      Utils.saveProgress({ timelineIndex: i + 1, choices: choicesMade });
    }

    sceneNumber = 1 + totalTimelines * 2 + 1;
    UI.updateProgress(totalTimelines, sceneNumber);
    await UI.showConvergence();

    sceneNumber += 1;
    UI.updateProgress(totalTimelines, sceneNumber);
    await UI.showEnding();

    // The journey is complete — clear so a future visit starts fresh.
    Utils.clearProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();