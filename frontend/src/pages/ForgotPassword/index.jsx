import { Link } from "react-router-dom";
import { useState } from "react";
import "./styles.css";
import logo from "../../assets/logo.png";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3333/api/users/recuperar-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setMensagem(data.message);
    } catch (error) {
      setMensagem("Erro ao enviar o email.");
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

            <button type="submit" className="login-btn">
              Enviar link
            </button>

            {/* 👇 MENSAGEM DE RETORNO */}
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