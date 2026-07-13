const prisma = require("../prisma/client");

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  course: true,
  shift: true,
  avatar: true,
  vehicleModel: true,
  vehicleColor: true,
  plate: true,
};

async function createRide(req, res) {
  try {
    const {
      type,
      origin,
      destination,
      bairro,
      rua,
      numero,
      latitude,
      longitude,
      date,
      time,
      seats,
      price,
      observation,
    } = req.body;

    if (!type || !origin || !destination || !date || !time) {
      return res.status(400).json({ error: "Preencha tipo, saída, destino, data e horário." });
    }

    if (type !== "OFERTA" && type !== "SOLICITACAO") {
      return res.status(400).json({ error: "O tipo deve ser OFERTA ou SOLICITACAO." });
    }

    const ride = await prisma.ride.create({
      data: {
        type,
        origin,
        destination,
        bairro,
        rua,
        numero,
        latitude,
        longitude,
        date,
        time,
        seats,
        price,
        observation,
        userId: req.userId,
      },
      include: { user: { select: USER_SELECT } },
    });

    await prisma.activity.create({
      data: {
        userId: req.userId,
        action: "CRIOU_CARONA",
        detail: `Você criou uma carona de ${origin} para ${destination}.`,
      },
    });

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
      include: {
        user: { select: USER_SELECT },
        passenger: { select: USER_SELECT },
        participants: true,
      },
    });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar caronas.", details: error.message });
  }
}

async function myRides(req, res) {
  try {
    // traz tanto as caronas que o usuário criou quanto as que ele aceitou
    const rides = await prisma.ride.findMany({
      where: {
        OR: [{ userId: req.userId }, { passengerId: req.userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: USER_SELECT },
        passenger: { select: USER_SELECT },
        participants: true,
      },
    });
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

// Motorista aceitando a solicitação de um aluno (ou aluno aceitando uma oferta)
async function acceptRide(req, res) {
  try {
    const { id } = req.params;

    const ride = await prisma.ride.findUnique({ where: { id } });
    if (!ride) return res.status(404).json({ error: "Carona não encontrada." });

    if (ride.status !== "PENDENTE") {
      return res.status(400).json({ error: "Essa carona já foi aceita ou não está mais disponível." });
    }

    if (ride.userId === req.userId) {
      return res.status(400).json({ error: "Você não pode aceitar sua própria carona." });
    }

    const updatedRide = await prisma.ride.update({
      where: { id },
      data: { passengerId: req.userId, status: "CONFIRMADA" },
      include: {
        user: { select: USER_SELECT },
        passenger: { select: USER_SELECT },
      },
    });

    await prisma.activity.create({
      data: {
        userId: req.userId,
        action: "ACEITOU_CARONA",
        detail: `Você aceitou a carona de ${updatedRide.user.name}.`,
      },
    });

    return res.json({ message: "Carona aceita com sucesso.", ride: updatedRide });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao aceitar carona.", details: error.message });
  }
}

module.exports = { createRide, listRides, myRides, updateRideStatus, acceptRide };