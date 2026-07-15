const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10, 
  message: {
    error: "Muitas tentativas de login. Aguarde 15 minutos e tente novamente."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };