const prisma = require("../prisma/client");

async function listActivities(req, res) {
  try {
    const activities = await prisma.activity.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" } });
    return res.json(activities);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar histórico.", details: error.message });
  }
}

module.exports = { listActivities };
