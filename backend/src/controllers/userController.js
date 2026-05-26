const prisma = require("../prisma/client");

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, course: true, shift: true, bio: true, avatar: true, verified: true, createdAt: true }
    });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar perfil.", details: error.message });
  }
}

async function updateMe(req, res) {
  try {
    const { name, course, shift, bio } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { name, course, shift, bio },
      select: { id: true, name: true, email: true, course: true, shift: true, bio: true, avatar: true, verified: true }
    });
    return res.json({ message: "Perfil atualizado com sucesso.", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar perfil.", details: error.message });
  }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada." });
    const avatarUrl = `/uploads/${req.file.filename}`;
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { avatar: avatarUrl },
      select: { id: true, name: true, email: true, avatar: true }
    });
    return res.json({ message: "Foto de perfil atualizada com sucesso.", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao enviar foto.", details: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, course: true, shift: true, bio: true, avatar: true, verified: true, createdAt: true, receivedRatings: { select: { score: true, comment: true, createdAt: true } } }
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    const totalRatings = user.receivedRatings.length;
    const average = totalRatings > 0 ? user.receivedRatings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings : 0;
    return res.json({ ...user, totalRatings, average: Number(average.toFixed(1)) });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar usuário.", details: error.message });
  }
}

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, course: true, shift: true, bio: true, avatar: true, verified: true }
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar usuários.", details: error.message });
  }
}

module.exports = { getMe, updateMe, uploadAvatar, getUserById, listUsers };
