/**
 * Rule-Based Novelty Scoring Service
 * Analyzes papers metadata to compute novelty score and recommendations
 */

/**
 * Frequency analysis helpers
 */
const countFrequency = (items) => {
  const freq = {};
  items.forEach(item => {
    if (item) {
      const key = item.toLowerCase().trim();
      freq[key] = (freq[key] || 0) + 1;
    }
  });
  return freq;
};

const getRareItems = (freqMap, topN = 5) => {
  return Object.entries(freqMap)
    .sort((a, b) => a[1] - b[1])
    .slice(0, topN)
    .map(([item]) => item);
};

const getCommonItems = (freqMap, topN = 5) => {
  return Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([item]) => item);
};

/**
 * Compute novelty score for a dimension (0-100)
 * Lower frequency = higher novelty opportunity
 */
const computeDimensionScore = (freqMap) => {
  const values = Object.values(freqMap);
  if (values.length === 0) return 75; // No data = high opportunity

  const total = values.reduce((a, b) => a + b, 0);
  const avg = total / values.length;
  const max = Math.max(...values);

  // Diversity score: the more diverse, the less saturated
  const diversity = values.length / (total || 1);
  const saturation = avg / (max || 1);
  const score = Math.min(100, Math.round((1 - saturation) * 50 + diversity * 50 + 25));
  return Math.max(10, Math.min(100, score));
};

/**
 * Extract years trend
 */
const analyzeYearTrend = (papers) => {
  const yearCounts = {};
  papers.forEach(p => {
    if (p.year) yearCounts[p.year] = (yearCounts[p.year] || 0) + 1;
  });

  const years = Object.keys(yearCounts).map(Number).sort();
  const currentYear = new Date().getFullYear();
  const recentPapers = papers.filter(p => p.year && p.year >= currentYear - 3).length;
  const trend = recentPapers > papers.length * 0.5 ? 'growing' : recentPapers > papers.length * 0.25 ? 'stable' : 'declining';

  return { yearCounts, trend, recentCount: recentPapers };
};

/**
 * Main novelty analysis function
 */
const analyzeNovelty = (papers) => {
  if (!papers || papers.length === 0) {
    return {
      noveltyScore: 80,
      dimensions: {
        topic: { score: 80, gap: 'No existing papers found - high opportunity for original research', suggestions: [] },
        method: { score: 80, gap: 'No existing papers found', suggestions: [] },
        object: { score: 80, gap: 'No existing papers found', suggestions: [] },
        location: { score: 80, gap: 'No existing papers found', suggestions: [] },
        variable: { score: 80, gap: 'No existing papers found', suggestions: [] },
        technology: { score: 80, gap: 'No existing papers found', suggestions: [] },
      },
      summary: 'Insufficient data for analysis. Add more papers to get detailed recommendations.',
      trend: null,
    };
  }

  // --- TOPIC analysis ---
  const allKeywords = [];
  papers.forEach(p => {
    try {
      const kw = JSON.parse(p.keywords || '[]');
      allKeywords.push(...kw);
    } catch {}
    // Also extract from title words
    const titleWords = (p.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 5);
    allKeywords.push(...titleWords.slice(0, 5));
  });
  const topicFreq = countFrequency(allKeywords);
  const commonTopics = getCommonItems(topicFreq, 5);
  const rareTopics = getRareItems(topicFreq, 5);
  const topicScore = computeDimensionScore(topicFreq);

  // --- METHOD analysis ---
  const methods = papers.map(p => p.analysis?.method).filter(Boolean);
  const methodFreq = countFrequency(methods);
  const commonMethods = getCommonItems(methodFreq, 5);
  const rareMethods = getRareItems(methodFreq, 5);
  const methodScore = computeDimensionScore(methodFreq);

  // --- OBJECT analysis ---
  const objects = papers.map(p => p.analysis?.researchObject).filter(Boolean);
  const objectFreq = countFrequency(objects);
  const commonObjects = getCommonItems(objectFreq, 5);
  const rareObjects = getRareItems(objectFreq, 5);
  const objectScore = computeDimensionScore(objectFreq);

  // --- LOCATION analysis ---
  const locations = papers.map(p => p.analysis?.location).filter(Boolean);
  const locationFreq = countFrequency(locations);
  const commonLocations = getCommonItems(locationFreq, 5);
  const rareLocations = getRareItems(locationFreq, 5);
  const locationScore = computeDimensionScore(locationFreq);

  // --- VARIABLE analysis ---
  const variables = [];
  papers.forEach(p => {
    try {
      const vars = JSON.parse(p.analysis?.variables || '[]');
      variables.push(...vars);
    } catch {}
  });
  const variableFreq = countFrequency(variables);
  const commonVariables = getCommonItems(variableFreq, 5);
  const rareVariables = getRareItems(variableFreq, 5);
  const variableScore = computeDimensionScore(variableFreq);

  // --- TECHNOLOGY analysis ---
  const technologies = papers.map(p => p.analysis?.technology).filter(Boolean);
  const techFreq = countFrequency(technologies);
  const commonTech = getCommonItems(techFreq, 5);
  const rareTech = getRareItems(techFreq, 5);
  const techScore = computeDimensionScore(techFreq);

  // --- YEAR TREND ---
  const yearTrend = analyzeYearTrend(papers);

  // --- WEIGHTED OVERALL SCORE ---
  const weights = { topic: 0.25, method: 0.20, object: 0.20, location: 0.15, variable: 0.10, technology: 0.10 };
  const noveltyScore = Math.round(
    topicScore * weights.topic +
    methodScore * weights.method +
    objectScore * weights.object +
    locationScore * weights.location +
    variableScore * weights.variable +
    techScore * weights.technology
  );

  // --- BUILD RECOMMENDATIONS ---
  const buildGap = (common, rare, type) => {
    if (common.length === 0 && rare.length === 0) return `No ${type} data available. Fill in paper analysis to get recommendations.`;
    const dominated = common.slice(0, 3).join(', ');
    const opportunity = rare.slice(0, 3).join(', ');
    let gap = '';
    if (dominated) gap += `Dominated by: "${dominated}". `;
    if (opportunity) gap += `Opportunity: explore "${opportunity}".`;
    return gap.trim() || `Diversified ${type} - low saturation detected.`;
  };

  const buildSuggestions = (common, rare, type) => {
    const suggestions = [];
    if (common.length > 0) suggestions.push(`Avoid over-studied ${type}: ${common.slice(0, 2).join(', ')}`);
    if (rare.length > 0) suggestions.push(`Consider under-explored ${type}: ${rare.slice(0, 2).join(', ')}`);
    if (Object.keys(countFrequency([])).length === 0 && rare.length === 0) {
      suggestions.push(`No ${type} data yet - add paper analysis for better recommendations`);
    }
    return suggestions;
  };

  const analysisCoverage = papers.filter(p => p.analysis).length;
  const coveragePct = Math.round((analysisCoverage / papers.length) * 100);

  const summary = `Analyzed ${papers.length} papers (${coveragePct}% with full analysis). ` +
    `Research trend is ${yearTrend.trend} with ${yearTrend.recentCount} papers in the last 3 years. ` +
    `Overall novelty opportunity score: ${noveltyScore}%. ` +
    (topicScore > 70 ? 'Topic space has significant gaps. ' : 'Topic space is well-covered. ') +
    (methodScore > 70 ? 'Methodological diversity is low — new methods needed. ' : '') +
    (locationScore > 70 ? 'Location diversity is low — new geographical contexts could be explored. ' : '') +
    `Recommendation: ${noveltyScore >= 70 ? 'High novelty potential — proceed with your research direction.' : noveltyScore >= 50 ? 'Moderate novelty — differentiate your approach.' : 'Saturated area — find a unique angle.'}`;

  return {
    noveltyScore,
    dimensions: {
      topic: {
        score: topicScore,
        gap: buildGap(commonTopics, rareTopics, 'topic'),
        suggestions: buildSuggestions(commonTopics, rareTopics, 'topic'),
        common: commonTopics,
        rare: rareTopics,
      },
      method: {
        score: methodScore,
        gap: buildGap(commonMethods, rareMethods, 'method'),
        suggestions: buildSuggestions(commonMethods, rareMethods, 'method'),
        common: commonMethods,
        rare: rareMethods,
      },
      object: {
        score: objectScore,
        gap: buildGap(commonObjects, rareObjects, 'object'),
        suggestions: buildSuggestions(commonObjects, rareObjects, 'object'),
        common: commonObjects,
        rare: rareObjects,
      },
      location: {
        score: locationScore,
        gap: buildGap(commonLocations, rareLocations, 'location'),
        suggestions: buildSuggestions(commonLocations, rareLocations, 'location'),
        common: commonLocations,
        rare: rareLocations,
      },
      variable: {
        score: variableScore,
        gap: buildGap(commonVariables, rareVariables, 'variable'),
        suggestions: buildSuggestions(commonVariables, rareVariables, 'variable'),
        common: commonVariables,
        rare: rareVariables,
      },
      technology: {
        score: techScore,
        gap: buildGap(commonTech, rareTech, 'technology'),
        suggestions: buildSuggestions(commonTech, rareTech, 'technology'),
        common: commonTech,
        rare: rareTech,
      },
    },
    summary,
    trend: yearTrend,
    analysisCoverage: { analyzed: analysisCoverage, total: papers.length, percentage: coveragePct },
  };
};

module.exports = { analyzeNovelty };
