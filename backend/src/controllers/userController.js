const crypto = require("crypto");
const bcrypt = require("bcrypt");
const prisma = require("../prisma/client");
const transporter = require("../config/mail");

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  course: true,
  shift: true,
  bio: true,
  avatar: true,
  vehicleModel: true,
  vehicleColor: true,
  plate: true,
  verified: true,
  createdAt: true,
};

async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: PROFILE_SELECT,
    });
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar perfil.", details: error.message });
  }
}

async function updateMe(req, res) {
  try {
    const { name, course, shift, bio, vehicleModel, vehicleColor, plate } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { name, course, shift, bio, vehicleModel, vehicleColor, plate },
      select: {
        id: true,
        name: true,
        email: true,
        course: true,
        shift: true,
        bio: true,
        avatar: true,
        vehicleModel: true,
        vehicleColor: true,
        plate: true,
        verified: true,
      },
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
      select: { id: true, name: true, email: true, avatar: true },
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
      select: {
        ...PROFILE_SELECT,
        receivedRatings: { select: { score: true, comment: true, createdAt: true } },
      },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const totalRatings = user.receivedRatings.length;
    const average =
      totalRatings > 0 ? user.receivedRatings.reduce((acc, rating) => acc + rating.score, 0) / totalRatings : 0;

    return res.json({ ...user, totalRatings, average: Number(average.toFixed(1)) });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao buscar usuário.", details: error.message });
  }
}

async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        course: true,
        shift: true,
        bio: true,
        avatar: true,
        vehicleModel: true,
        vehicleColor: true,
        plate: true,
        verified: true,
      },
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: "Erro ao listar usuários.", details: error.message });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Informe o e-mail.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        message:
          "Se esse e-mail estiver cadastrado, você receberá as instruções.",
      });
    }

    // Gera um token aleatório
    const token = crypto.randomBytes(32).toString("hex");

    // Expira em 1 hora
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    // Salva no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExp: expiry,
      },
    });


    // CRIA O LINK ANTES DE USAR NO EMAIL
    const resetLink = `http://localhost:5173/resetar-senha/${token}`;


    await transporter.sendMail({
      from: `"UniRota" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Recuperação de senha - UniRota",
      html: `
        <h2>Recuperação de senha</h2>

        <p>Olá, ${user.name}!</p>

        <p>Clique no link abaixo para redefinir sua senha:</p>

        <a href="${resetLink}">
          Redefinir senha
        </a>

        <p>Esse link expira em 1 hora.</p>
      `,
    });


    console.log("==================================");
    console.log("LINK DE RECUPERAÇÃO:");
    console.log(resetLink);
    console.log("==================================");


    return res.json({
      message:
        "Se esse e-mail estiver cadastrado, você receberá as instruções.",

      // Remover depois que testar
      resetLinkDev: resetLink,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao solicitar recuperação de senha.",
      details: error.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "Token e nova senha são obrigatórios.",
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        error: "Link inválido ou expirado. Solicite um novo.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return res.json({
      message: "Senha redefinida com sucesso. Você já pode fazer login.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Erro ao redefinir senha.",
      details: error.message,
    });
  }
}

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  getUserById,
  listUsers,
  forgotPassword,
  resetPassword,
};