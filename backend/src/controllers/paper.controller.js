const prisma = require('../lib/prisma');
const { searchOpenAlex, searchCrossref, searchSemanticScholar, deduplicatePapers } = require('../services/paperSearch.service');

const searchAndStore = async (req, res, next) => {
  try {
    const { projectId, keywords, sources = ['openalex', 'crossref', 'semanticscholar'], limit = 20, startYear, endYear } = req.body;

    if (!projectId || !keywords) {
      return res.status(400).json({ error: 'projectId and keywords are required' });
    }

    // Verify project ownership
    const project = await prisma.searchProject.findFirst({
      where: { id: parseInt(projectId), userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const keywordArr = Array.isArray(keywords) ? keywords : keywords.split(',').map(k => k.trim());

    // Fetch from APIs in parallel
    const promises = [];
    const sy = startYear ? parseInt(startYear) : undefined;
    const ey = endYear ? parseInt(endYear) : undefined;

    if (sources.includes('openalex')) promises.push(searchOpenAlex(keywordArr, limit, sy, ey));
    if (sources.includes('crossref')) promises.push(searchCrossref(keywordArr, limit, sy, ey));
    if (sources.includes('semanticscholar')) promises.push(searchSemanticScholar(keywordArr, limit, sy, ey));
    if (sources.includes('scopus')) promises.push(searchScopus(keywordArr, limit, sy, ey));
    if (sources.includes('scholar')) promises.push(searchGoogleScholar(keywordArr, limit, sy, ey));

    const results = await Promise.allSettled(promises);
    let allPapers = [];
    results.forEach(r => { if (r.status === 'fulfilled') allPapers.push(...r.value); });

    // Deduplicate
    const unique = deduplicatePapers(allPapers);

    // Store to DB - skip existing DOIs
    let stored = 0, skipped = 0;
    const storedPapers = [];

    for (const paper of unique) {
      try {
        // Check DOI conflict globally
        if (paper.doi) {
          const existing = await prisma.paper.findUnique({ where: { doi: paper.doi } });
          if (existing) { skipped++; continue; }
        }

        const created = await prisma.paper.create({
          data: {
            projectId: parseInt(projectId),
            title: paper.title,
            authors: JSON.stringify(paper.authors),
            year: paper.year,
            journal: paper.journal || null,
            doi: paper.doi || null,
            abstract: paper.abstract || null,
            citations: paper.citations || 0,
            url: paper.url || null,
            sourceApi: paper.sourceApi,
            keywords: JSON.stringify(paper.keywords || []),
          },
        });
        storedPapers.push(created);
        stored++;
      } catch (e) {
        if (e.code === 'P2002') skipped++; // unique constraint
        else console.error('Paper insert error:', e.message);
      }
    }

    // Update project keywords
    const existingKw = JSON.parse(project.keywords || '[]');
    const merged = [...new Set([...existingKw, ...keywordArr])];
    await prisma.searchProject.update({
      where: { id: parseInt(projectId) },
      data: { keywords: JSON.stringify(merged) },
    });

    res.json({
      message: `Search complete. ${stored} papers stored, ${skipped} duplicates skipped.`,
      total: unique.length,
      stored,
      skipped,
      papers: storedPapers,
    });
  } catch (error) { next(error); }
};

const getByProject = async (req, res, next) => {
  try {
    const { projectId, year, source, search, page = 1, limit = 20 } = req.query;
    if (!projectId) return res.status(400).json({ error: 'projectId is required' });

    // Verify ownership
    const project = await prisma.searchProject.findFirst({
      where: { id: parseInt(projectId), userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId: parseInt(projectId) };
    if (year) where.year = parseInt(year);
    if (source) where.sourceApi = source;
    if (search) where.title = { contains: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [papers, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        include: { analysis: true },
        orderBy: { year: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paper.count({ where }),
    ]);

    res.json({ papers, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getOne = async (req, res, next) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { analysis: true, project: { select: { userId: true } } },
    });
    if (!paper || paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    res.json({ paper });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { project: { select: { userId: true } } },
    });
    if (!paper || paper.project.userId !== req.user.id) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    await prisma.paper.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Paper deleted' });
  } catch (error) { next(error); }
};

const clearProject = async (req, res, next) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const project = await prisma.searchProject.findFirst({
      where: { id: projectId, userId: req.user.id },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { count } = await prisma.paper.deleteMany({ where: { projectId } });
    res.json({ message: `${count} papers deleted from project` });
  } catch (error) { next(error); }
};

module.exports = { searchAndStore, getByProject, getOne, remove, clearProject };
