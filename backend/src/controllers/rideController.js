const prisma = require("../prisma/client");

async function createRide(req, res) {
  try {
    const { type, origin, destination, date, time, seats, price, observation } = req.body;
    if (!type || !origin || !destination || !date || !time) return res.status(400).json({ error: "Preencha tipo, saída, destino, data e horário." });
    if (type !== "OFERTA" && type !== "SOLICITACAO") return res.status(400).json({ error: "O tipo deve ser OFERTA ou SOLICITACAO." });

    const ride = await prisma.ride.create({
      data: { type, origin, destination, date, time, seats, price, observation, userId: req.userId },
      include: { user: { select: { id: true, name: true, email: true, course: true, shift: true, avatar: true } } }
    });

    await prisma.activity.create({ data: { userId: req.userId, action: "CRIOU_CARONA", detail: `Você criou uma carona de ${origin} para ${destination}.` } });
    return res.status(201).json({ message: "Carona criada com sucesso.", ride });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar carona.", details: error.message });
  }
}

async function listRides(req, res) {
  try {
    const { type, origin, destination, date, status } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (date) filters.date = date;
    if (status) filters.status = status;
    if (origin) filters.origin = { contains: origin, mode: "insensitive" };
    if (destination) filters.destination = { contains: destination, mode: "insensitive" };

    const rides = await prisma.ride.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true, course: true, shift: true, avatar: true } }, participants: true }
    });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar caronas.", details: error.message });
  }
}

async function myRides(req, res) {
  try {
    const rides = await prisma.ride.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, include: { participants: true } });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar minhas caronas.", details: error.message });
  }
}

async function updateRideStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatus = ["PENDENTE", "CONFIRMADA", "CANCELADA", "FINALIZADA"];
    if (!allowedStatus.includes(status)) return res.status(400).json({ error: "Status inválido." });

    const ride = await prisma.ride.findFirst({ where: { id, userId: req.userId } });
    if (!ride) return res.status(404).json({ error: "Carona não encontrada." });

    const updatedRide = await prisma.ride.update({ where: { id }, data: { status } });
    return res.json({ message: "Status da carona atualizado.", ride: updatedRide });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao atualizar carona.", details: error.message });
  }
}

module.exports = { createRide, listRides, myRides, updateRideStatus };
