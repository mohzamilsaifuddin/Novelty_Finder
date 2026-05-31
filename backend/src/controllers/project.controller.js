const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    const projects = await prisma.searchProject.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { papers: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { name, keywords, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const keywordsStr = Array.isArray(keywords)
      ? JSON.stringify(keywords)
      : JSON.stringify(keywords?.split(',').map(k => k.trim()) || []);

    const project = await prisma.searchProject.create({
      data: { userId: req.user.id, name, keywords: keywordsStr, description },
    });
    res.status(201).json({ project });
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const project = await prisma.searchProject.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
      include: {
        papers: { include: { analysis: true }, orderBy: { year: 'desc' } },
        noveltyRecommendations: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { papers: true } },
      },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { name, keywords, description, status } = req.body;
    const existing = await prisma.searchProject.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    const updateData = {};
    if (name) updateData.name = name;
    if (keywords) updateData.keywords = Array.isArray(keywords) ? JSON.stringify(keywords) : keywords;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const project = await prisma.searchProject.update({
      where: { id: parseInt(req.params.id) },
      data: updateData,
    });
    res.json({ project });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.searchProject.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Project not found' });

    await prisma.searchProject.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await prisma.searchProject.findFirst({
      where: { id: projectId, userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const papers = await prisma.paper.findMany({
      where: { projectId },
      include: { analysis: true },
    });

    // Year distribution
    const yearDist = {};
    papers.forEach(p => {
      if (p.year) yearDist[p.year] = (yearDist[p.year] || 0) + 1;
    });

    // Source distribution
    const sourceDist = { openalex: 0, crossref: 0, semanticscholar: 0 };
    papers.forEach(p => { sourceDist[p.sourceApi] = (sourceDist[p.sourceApi] || 0) + 1; });

    // Methods distribution
    const methodDist = {};
    papers.forEach(p => {
      if (p.analysis?.method) {
        methodDist[p.analysis.method] = (methodDist[p.analysis.method] || 0) + 1;
      }
    });

    // Top cited
    const topCited = [...papers]
      .sort((a, b) => (b.citations || 0) - (a.citations || 0))
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title, citations: p.citations, year: p.year }));

    res.json({
      total: papers.length,
      yearDistribution: yearDist,
      sourceDistribution: sourceDist,
      methodDistribution: methodDist,
      topCited,
    });
  } catch (error) { next(error); }
};

module.exports = { getAll, create, getOne, update, remove, getStats };
