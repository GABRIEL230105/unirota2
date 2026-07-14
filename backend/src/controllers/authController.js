const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma/client");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

function isIfamEmail(email) {
  const regex = /^[0-9]{10}@ifam\.edu\.br$/;
  return regex.test(email);
}

async function register(req, res) {
  try {
    const { name, email, password, course, shift, bio, vehicleModel, vehicleColor, plate } = req.body;

    if (!name || !email || !password || !course || !shift) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    if (!isIfamEmail(email)) {
      return res.status(400).json({ error: "Use apenas e-mail institucional do IFAM no formato 2023008550@ifam.edu.br." });
    }

    const userAlreadyExists = await prisma.user.findUnique({ where: { email } });
    if (userAlreadyExists) return res.status(400).json({ error: "Este e-mail já está cadastrado." });

    // Veículo é opcional no cadastro — mas se o aluno começar a preencher, exige os três campos
    const informouVeiculo = vehicleModel || vehicleColor || plate;
    if (informouVeiculo && (!vehicleModel || !vehicleColor || !plate)) {
      return res.status(400).json({ error: "Preencha modelo, cor e placa do veículo, ou deixe os três em branco." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        course,
        shift,
        bio,
        verified: true,
        vehicleModel: vehicleModel || null,
        vehicleColor: vehicleColor || null,
        plate: plate || null,
      },
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

    return res.status(201).json({ message: "Usuário cadastrado com sucesso.", user });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao cadastrar usuário.", details: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Informe e-mail e senha." });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "E-mail ou senha inválidos." });

    const passwordIsValid = await bcrypt.compare(password, user.password);
    if (!passwordIsValid) return res.status(401).json({ error: "E-mail ou senha inválidos." });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        course: user.course,
        shift: user.shift,
        bio: user.bio,
        avatar: user.avatar,
        vehicleModel: user.vehicleModel,
        vehicleColor: user.vehicleColor,
        plate: user.plate,
        verified: user.verified,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: "Erro ao fazer login.", details: error.message });
  }
}

module.exports = { register, login };