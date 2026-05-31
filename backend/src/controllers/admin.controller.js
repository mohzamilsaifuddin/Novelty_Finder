const prisma = require('../lib/prisma');

const getUsers = async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
    if (role) where.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { projects: true, savedPapers: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    if (userId === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself' });

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: 'User deleted' });
  } catch (error) { next(error); }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student'].includes(role)) return res.status(400).json({ error: 'Invalid role' });

    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (error) { next(error); }
};

const getPapers = async (req, res, next) => {
  try {
    const { search, source, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) where.title = { contains: search };
    if (source) where.sourceApi = source;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [papers, total] = await Promise.all([
      prisma.paper.findMany({
        where,
        include: { project: { select: { name: true, user: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paper.count({ where }),
    ]);

    res.json({ papers, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [projects, total] = await Promise.all([
      prisma.searchProject.findMany({
        include: {
          user: { select: { name: true, email: true } },
          _count: { select: { papers: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.searchProject.count(),
    ]);

    res.json({ projects, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const [userCount, projectCount, paperCount, savedCount] = await Promise.all([
      prisma.user.count(),
      prisma.searchProject.count(),
      prisma.paper.count(),
      prisma.savedPaper.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const sourceDist = await prisma.paper.groupBy({
      by: ['sourceApi'],
      _count: { id: true },
    });

    res.json({
      stats: { users: userCount, projects: projectCount, papers: paperCount, saved: savedCount },
      recentUsers,
      sourceDistribution: sourceDist,
    });
  } catch (error) { next(error); }
};

module.exports = { getUsers, deleteUser, updateUserRole, getPapers, getProjects, getStats };
