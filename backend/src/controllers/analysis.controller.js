const prisma = require('../lib/prisma');
const { autoExtractMatrix } = require('../services/aiExtraction.service');

const getByPaper = async (req, res, next) => {
  try {
    const { paperId } = req.query;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });

    const analysis = await prisma.paperAnalysis.findUnique({
      where: { paperId: parseInt(paperId) },
      include: { paper: { select: { title: true, project: { select: { userId: true } } } } },
    });

    if (analysis && analysis.paper.project.userId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ analysis: analysis || null });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { paperId, method, researchObject, variables, location, technology, results, limitations, opportunities } = req.body;

    if (!paperId) return res.status(400).json({ error: 'paperId is required' });

    // Verify paper ownership
    const paper = await prisma.paper.findUnique({
      where: { id: parseInt(paperId) },
      include: { project: { select: { userId: true } } },
    });
    if (!paper || paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Paper not found' });
    }

    const analysis = await prisma.paperAnalysis.upsert({
      where: { paperId: parseInt(paperId) },
      create: {
        paperId: parseInt(paperId),
        method, researchObject,
        variables: variables ? JSON.stringify(Array.isArray(variables) ? variables : [variables]) : null,
        location, technology, results, limitations, opportunities,
      },
      update: {
        method, researchObject,
        variables: variables ? JSON.stringify(Array.isArray(variables) ? variables : [variables]) : null,
        location, technology, results, limitations, opportunities,
      },
    });

    res.status(201).json({ analysis });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { method, researchObject, variables, location, technology, results, limitations, opportunities } = req.body;

    const existing = await prisma.paperAnalysis.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { paper: { include: { project: { select: { userId: true } } } } },
    });

    if (!existing || existing.paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    const updated = await prisma.paperAnalysis.update({
      where: { id: parseInt(req.params.id) },
      data: {
        method, researchObject,
        variables: variables ? JSON.stringify(Array.isArray(variables) ? variables : [variables]) : undefined,
        location, technology, results, limitations, opportunities,
      },
    });

    res.json({ analysis: updated });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.paperAnalysis.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { paper: { include: { project: { select: { userId: true } } } } },
    });
    if (!existing || existing.paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Analysis not found' });
    }
    await prisma.paperAnalysis.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Analysis deleted' });
  } catch (error) { next(error); }
};

const autoExtract = async (req, res, next) => {
  try {
    const { paperId } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });

    // Verify paper ownership and get abstract
    const paper = await prisma.paper.findUnique({
      where: { id: parseInt(paperId) },
      include: { project: { select: { userId: true } } },
    });
    
    if (!paper || paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    if (!paper.abstract) {
      return res.status(400).json({ error: 'Paper does not have an abstract to extract from' });
    }

    // Call Gemini API
    const extractedData = await autoExtractMatrix(paper.abstract);

    // Upsert analysis in DB
    const analysis = await prisma.paperAnalysis.upsert({
      where: { paperId: parseInt(paperId) },
      create: {
        paperId: parseInt(paperId),
        method: extractedData.method,
        researchObject: extractedData.object,
        variables: JSON.stringify([extractedData.variable]),
        location: extractedData.location,
        results: extractedData.result,
        limitations: extractedData.limitations,
        opportunities: extractedData.opportunities,
      },
      update: {
        method: extractedData.method,
        researchObject: extractedData.object,
        variables: JSON.stringify([extractedData.variable]),
        location: extractedData.location,
        results: extractedData.result,
        limitations: extractedData.limitations,
        opportunities: extractedData.opportunities,
      },
    });

    res.json({ message: 'Auto-extraction successful', analysis });
  } catch (error) { next(error); }
};

module.exports = { getByPaper, create, update, remove, autoExtract };
