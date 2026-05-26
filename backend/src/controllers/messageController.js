const prisma = require("../prisma/client");

async function sendMessage(req, res) {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) return res.status(400).json({ error: "Informe o destinatário e a mensagem." });
    if (receiverId === req.userId) return res.status(400).json({ error: "Você não pode enviar mensagem para si mesmo." });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ error: "Usuário destinatário não encontrado." });

    const message = await prisma.message.create({
      data: { senderId: req.userId, receiverId, content },
      include: { sender: { select: { id: true, name: true, email: true, avatar: true } }, receiver: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    await prisma.notification.create({ data: { userId: receiverId, title: "Nova mensagem", message: "Você recebeu uma nova mensagem.", type: "MESSAGE" } });
    return res.status(201).json({ message: "Mensagem enviada com sucesso.", data: message });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao enviar mensagem.", details: error.message });
  }
}

async function listConversation(req, res) {
  try {
    const { userId } = req.params;
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId, receiverId: userId }, { senderId: userId, receiverId: req.userId }] },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, email: true, avatar: true } }, receiver: { select: { id: true, name: true, email: true, avatar: true } } }
    });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar conversa.", details: error.message });
  }
}

async function listInbox(req, res) {
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, name: true, email: true, avatar: true } }, receiver: { select: { id: true, name: true, email: true, avatar: true } } }
    });
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar caixa de mensagens.", details: error.message });
  }
}

module.exports = { sendMessage, listConversation, listInbox };
