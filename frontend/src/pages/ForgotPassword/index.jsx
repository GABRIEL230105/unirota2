import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../services/api";
import "./styles.css";
import logo from "../../assets/logo.png";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensagem("");

    try {
      const response = await api.post("/users/recuperar-senha", { email });
      setMensagem(response.data.message);

      // ⚠️ só existe em dev, enquanto não tem envio de e-mail de verdade — remover depois
      if (response.data.resetLinkDev) {
        console.log("Link de redefinição (modo dev):", response.data.resetLinkDev);
      }
    } catch (error) {
      setMensagem(error.response?.data?.error || "Erro ao enviar o e-mail.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />

          <h1>UniRota</h1>
          <p className="subtitle">Carona Universitária</p>

          <p className="slogan">
            Recuperar acesso à sua conta
          </p>

          <form onSubmit={handleSubmit} className="login-card">
            <h2>Esqueceu sua senha?</h2>
            <p>Digite seu e-mail para receber o link</p>

            <div className="input-group">
              <input
                type="email"
                placeholder="E-mail universitário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link"}
            </button>

            {mensagem && (
              <p style={{ marginTop: "10px", textAlign: "center" }}>
                {mensagem}
              </p>
            )}

            <div className="register-link">
              <span>Lembrou a senha?</span>
              <Link to="/login"> Voltar para login</Link>
            </div>
          </form>

          <div className="benefits">
            <div>
              <strong>Seguro</strong>
              <span>Viagens verificadas</span>
            </div>

            <div>
              <strong>Econômico</strong>
              <span>Divida custos</span>
            </div>

            <div>
              <strong>Sustentável</strong>
              <span>Menos carros</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};