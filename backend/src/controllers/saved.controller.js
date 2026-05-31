const prisma = require('../lib/prisma');

const getAll = async (req, res, next) => {
  try {
    const saved = await prisma.savedPaper.findMany({
      where: { userId: req.user.id },
      include: {
        paper: {
          include: { analysis: true, project: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ saved });
  } catch (error) { next(error); }
};

const save = async (req, res, next) => {
  try {
    const { paperId, notes } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });

    const paper = await prisma.paper.findUnique({ where: { id: parseInt(paperId) } });
    if (!paper) return res.status(404).json({ error: 'Paper not found' });

    const saved = await prisma.savedPaper.upsert({
      where: { userId_paperId: { userId: req.user.id, paperId: parseInt(paperId) } },
      create: { userId: req.user.id, paperId: parseInt(paperId), notes },
      update: { notes },
      include: { paper: true },
    });

    res.status(201).json({ saved });
  } catch (error) { next(error); }
};

const updateNotes = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const existing = await prisma.savedPaper.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Saved paper not found' });

    const updated = await prisma.savedPaper.update({
      where: { id: parseInt(req.params.id) },
      data: { notes },
      include: { paper: true },
    });
    res.json({ saved: updated });
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const existing = await prisma.savedPaper.findFirst({
      where: { id: parseInt(req.params.id), userId: req.user.id },
    });
    if (!existing) return res.status(404).json({ error: 'Saved paper not found' });

    await prisma.savedPaper.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Paper removed from collection' });
  } catch (error) { next(error); }
};

module.exports = { getAll, save, updateNotes, remove };
