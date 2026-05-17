/**
 * Calculates Cosine Similarity between two vectors
 */
export const cosineSimilarity = (vecA, vecB) => {
  const dotProduct = Object.keys(vecA).reduce((sum, key) => {
    return sum + (vecA[key] * (vecB[key] || 0));
  }, 0);

  const magnitudeA = Math.sqrt(Object.values(vecA).reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(Object.values(vecB).reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

/**
 * Recommends modules based on student weaknesses using Cosine Similarity.
 * Weakness vector: higher = more need for that skill.
 * - confidence: 1 - score (low confidence = high weakness)
 * - articulation: 1 - score (low articulation = high weakness)  
 * - speed: distance from ideal (0.7 wpm), penalised if too fast or too slow
 * - fillers: raw filler score (high fillers score = high weakness, needs reduction)
 */
export const recommendModules = (studentScores, domainModel, limit = 3) => {
  const weaknessVector = {
    confidence: 1 - studentScores.confidence,
    articulation: 1 - studentScores.articulation,
    speed: Math.abs(0.7 - studentScores.speed),
    fillers: studentScores.fillers  // FIXED: high fillers = high weakness (was inverted before)
  };

  const scoredModules = domainModel.map(module => {
    const similarity = cosineSimilarity(weaknessVector, module.requirements);
    return { ...module, similarity };
  });

  // Sort by similarity descending
  return scoredModules.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
};
