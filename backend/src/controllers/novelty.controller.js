const prisma = require('../lib/prisma');
const { analyzeNovelty } = require('../services/novelty.service');
const { generateNoveltyConclusion } = require('../services/aiExtraction.service');

const analyze = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await prisma.searchProject.findFirst({
      where: { id: parseInt(projectId), userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const papers = await prisma.paper.findMany({
      where: { projectId: parseInt(projectId) },
      include: { analysis: true },
    });

    const result = analyzeNovelty(papers);
    
    // Call AI to generate a smarter conclusion
    const aiSummary = await generateNoveltyConclusion(papers, result);
    result.summary = aiSummary; // Overwrite rule-based summary with AI summary

    // Save recommendation
    const saved = await prisma.noveltyRecommendation.create({
      data: {
        projectId: parseInt(projectId),
        noveltyTopic: result.dimensions.topic.gap,
        noveltyMethod: result.dimensions.method.gap,
        noveltyObject: result.dimensions.object.gap,
        noveltyLocation: result.dimensions.location.gap,
        noveltyVariable: result.dimensions.variable.gap,
        noveltyTechnology: result.dimensions.technology.gap,
        noveltyScore: result.noveltyScore,
        analysisSummary: result.summary,
      },
    });

    res.json({ recommendation: saved, details: result });
  } catch (error) { next(error); }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    const project = await prisma.searchProject.findFirst({
      where: { id: parseInt(projectId), userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const recommendations = await prisma.noveltyRecommendation.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ recommendations });
  } catch (error) { next(error); }
};

module.exports = { analyze, getByProject };
