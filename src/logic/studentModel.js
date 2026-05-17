export const createInitialStudentModel = () => ({
  scores: {
    confidence: 0,
    articulation: 0,
    speed: 0,
    fillers: 0
  },
  level: "Belum Dinilai", // Pemula, Menengah, Mahir
  progress: [],           // Array of completed module IDs
  badges: [],
  history: []             // Array of { moduleId, score, date, metrics }
});

export const updateStudentScores = (currentModel, newScores) => {
  return {
    ...currentModel,
    scores: {
      ...currentModel.scores,
      ...newScores
    },
    level: calculateLevel({ ...currentModel.scores, ...newScores })
  };
};

/**
 * Called when a module is completed from TrainingSession.
 * Updates all 4 scores proportional to module requirements,
 * records history entry, and recalculates level.
 */
export const completeModuleUpdate = (currentModel, module, sessionScore, metrics) => {
  const GAIN_RATE = 0.08; // 8% gain per completed session per skill

  const updatedScores = {
    confidence:   Math.min(1, currentModel.scores.confidence   + (module.requirements.confidence   * GAIN_RATE)),
    articulation: Math.min(1, currentModel.scores.articulation + (module.requirements.articulation * GAIN_RATE)),
    speed:        Math.min(1, currentModel.scores.speed        + (module.requirements.speed        * GAIN_RATE)),
    fillers:      Math.max(0, currentModel.scores.fillers      - (module.requirements.fillers      * GAIN_RATE)), // fillers should go DOWN
  };

  const newLevel = calculateLevel(updatedScores);

  const historyEntry = {
    moduleId: module.id,
    moduleTitle: module.title,
    score: sessionScore,
    metrics: metrics,
    date: new Date().toISOString(),
    level: module.level
  };

  const newProgress = currentModel.progress.includes(module.id)
    ? currentModel.progress
    : [...currentModel.progress, module.id];

  return {
    ...currentModel,
    scores: updatedScores,
    level: newLevel,
    progress: newProgress,
    history: [historyEntry, ...currentModel.history].slice(0, 20) // keep last 20 entries
  };
};

const calculateLevel = (scores) => {
  // Invert fillers for the average (less fillers = better)
  const avg = (scores.confidence + scores.articulation + scores.speed + (1 - scores.fillers)) / 4;
  if (avg < 0.4) return "Pemula";
  if (avg < 0.7) return "Menengah";
  return "Mahir";
};
