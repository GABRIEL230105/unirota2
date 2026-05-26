const prisma = require("../prisma/client");

async function joinRide(req, res) {
  try {
    const { rideId } = req.params;
    const ride = await prisma.ride.findUnique({ where: { id: rideId }, include: { participants: true } });
    if (!ride) return res.status(404).json({ error: "Carona não encontrada." });
    if (ride.userId === req.userId) return res.status(400).json({ error: "Você não pode participar da própria carona." });

    const alreadyJoined = await prisma.rideParticipant.findUnique({ where: { rideId_userId: { rideId, userId: req.userId } } });
    if (alreadyJoined) return res.status(400).json({ error: "Você já está participando desta carona." });

    if (ride.type === "OFERTA" && ride.seats !== null) {
      const confirmedParticipants = ride.participants.filter((p) => p.status === "CONFIRMADA");
      if (confirmedParticipants.length >= ride.seats) return res.status(400).json({ error: "Não há mais vagas disponíveis nesta carona." });
    }

    const participant = await prisma.rideParticipant.create({
      data: { rideId, userId: req.userId, status: "CONFIRMADA" },
      include: { ride: true, user: { select: { id: true, name: true, email: true, course: true, shift: true, avatar: true } } }
    });

    await prisma.notification.create({ data: { userId: ride.userId, title: "Nova participação na sua carona", message: "Um estudante confirmou participação na sua carona.", type: "RIDE" } });
    await prisma.activity.create({ data: { userId: req.userId, action: "PARTICIPOU_CARONA", detail: `Você confirmou participação em uma carona para ${ride.destination}.` } });

    return res.status(201).json({ message: "Participação confirmada com sucesso.", participant });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao participar da carona.", details: error.message });
  }
}

async function cancelParticipation(req, res) {
  try {
    const { rideId } = req.params;
    const participation = await prisma.rideParticipant.findUnique({ where: { rideId_userId: { rideId, userId: req.userId } } });
    if (!participation) return res.status(404).json({ error: "Participação não encontrada." });
    await prisma.rideParticipant.update({ where: { id: participation.id }, data: { status: "CANCELADA" } });
    return res.json({ message: "Participação cancelada com sucesso." });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao cancelar participação.", details: error.message });
  }
}

async function myPassengerRides(req, res) {
  try {
    const rides = await prisma.rideParticipant.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, include: { ride: { include: { user: { select: { id: true, name: true, email: true, course: true, shift: true, avatar: true } } } } } });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar caronas como passageiro.", details: error.message });
  }
}

async function myDriverRides(req, res) {
  try {
    const rides = await prisma.ride.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, include: { participants: { include: { user: { select: { id: true, name: true, email: true, course: true, shift: true, avatar: true } } } } } });
    return res.json(rides);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar caronas como motorista.", details: error.message });
  }
}

module.exports = { joinRide, cancelParticipation, myPassengerRides, myDriverRides };
