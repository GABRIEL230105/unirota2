const prisma = require("../prisma/client");

async function createRating(req, res) {
  try {
    const { rideId, score, comment } = req.body;

    if (!rideId || !score) {
      return res.status(400).json({ error: "Informe a carona e a nota." });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ error: "A nota deve ser entre 1 e 5." });
    }

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: "Carona não encontrada." });

    if (ride.status !== "FINALIZADA") {
      return res.status(400).json({ error: "Só é possível avaliar caronas finalizadas." });
    }

    const fazParte = ride.userId === req.userId || ride.passengerId === req.userId;
    if (!fazParte) return res.status(403).json({ error: "Você não fez parte dessa carona." });

    const evaluatedId = ride.userId === req.userId ? ride.passengerId : ride.userId;
    if (!evaluatedId) return res.status(400).json({ error: "Não há quem avaliar nessa carona." });

    const rating = await prisma.rating.create({
      data: {
        rideId,
        evaluatorId: req.userId,
        evaluatedId,
        score,
        comment,
      },
    });

    return res.status(201).json({ message: "Avaliação registrada com sucesso.", rating });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Você já avaliou essa carona." });
    }
    return res.status(500).json({ error: "Erro ao registrar avaliação.", details: error.message });
  }
}

// Caronas finalizadas em que o usuário ainda não avaliou a outra parte
async function listMyPendingRatings(req, res) {
  try {
    const rides = await prisma.ride.findMany({
      where: {
        status: "FINALIZADA",
        OR: [{ userId: req.userId }, { passengerId: req.userId }],
      },
      include: {
        user: { select: { id: true, name: true } },
        passenger: { select: { id: true, name: true } },
        ratings: true,
      },
    });

    const pendentes = rides
      .filter((ride) => !ride.ratings.some((r) => r.evaluatorId === req.userId))
      .map((ride) => {
        const outraParte = ride.userId === req.userId ? ride.passenger : ride.user;
        return {
          rideId: ride.id,
          outraParte,
          origin: ride.origin,
          destination: ride.destination,
          price: ride.price,
          date: ride.date,
        };
      });

    return res.json(pendentes);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar avaliações pendentes.", details: error.message });
  }
}

module.exports = { createRating, listMyPendingRatings };