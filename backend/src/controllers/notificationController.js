const prisma = require("../prisma/client");

async function listNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" } });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar notificações.", details: error.message });
  }
}

async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findFirst({ where: { id, userId: req.userId } });
    if (!notification) return res.status(404).json({ error: "Notificação não encontrada." });
    const updatedNotification = await prisma.notification.update({ where: { id }, data: { read: true } });
    return res.json({ message: "Notificação marcada como lida.", notification: updatedNotification });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar notificação.", details: error.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } });
    return res.json({ message: "Todas as notificações foram marcadas como lidas." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar notificações.", details: error.message });
  }
}

module.exports = { listNotifications, markAsRead, markAllAsRead };
