const prisma = require("../prisma/client");

async function createRating(req, res) {
  try {
    const { rideId } = req.params;
    const { evaluatedId, score, comment } = req.body;
    if (!evaluatedId || !score) return res.status(400).json({ error: "Informe usuário avaliado e nota." });
    if (score < 1 || score > 5) return res.status(400).json({ error: "A nota deve ser entre 1 e 5." });
    if (evaluatedId === req.userId) return res.status(400).json({ error: "Você não pode avaliar a si mesmo." });

    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) return res.status(404).json({ error: "Carona não encontrada." });

    const alreadyRated = await prisma.rating.findUnique({ where: { rideId_evaluatorId_evaluatedId: { rideId, evaluatorId: req.userId, evaluatedId } } });
    if (alreadyRated) return res.status(400).json({ error: "Você já avaliou este usuário nesta carona." });

    const rating = await prisma.rating.create({
      data: { rideId, evaluatorId: req.userId, evaluatedId, score, comment },
      include: { evaluator: { select: { id: true, name: true, email: true } }, evaluated: { select: { id: true, name: true, email: true } } }
    });

    await prisma.notification.create({ data: { userId: evaluatedId, title: "Nova avaliação recebida", message: `Você recebeu uma avaliação de ${score} estrelas.`, type: "RATING" } });
    return res.status(201).json({ message: "Avaliação realizada com sucesso.", rating });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao avaliar usuário.", details: error.message });
  }
}

async function getUserRatings(req, res) {
  try {
    const { userId } = req.params;
    const ratings = await prisma.rating.findMany({
      where: { evaluatedId: userId },
      orderBy: { createdAt: "desc" },
      include: { evaluator: { select: { id: true, name: true, course: true, avatar: true } } }
    });
    const totalRatings = ratings.length;
    const average = totalRatings > 0 ? ratings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings : 0;
    return res.json({ totalRatings, average: Number(average.toFixed(1)), ratings });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar avaliações.", details: error.message });
  }
}

module.exports = { createRating, getUserRatings };
