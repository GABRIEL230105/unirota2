import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../services/api";
import "./styles.css";
import logo from "../../assets/logo.png";

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setEnviando(true);

    try {
      const response = await api.post("/users/resetar-senha", { token, password });
      setMessage(response.data.message);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao redefinir senha.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">

          <img
            src={logo}
            alt="UniRota"
            className="login-logo-img"
          />

          <h1>UniRota</h1>

          <p className="subtitle">
            Carona Universitária
          </p>

          <p className="slogan">
            Redefina sua senha <br />
            e volte para sua conta.
          </p>

          <form onSubmit={handleSubmit} className="login-card">

            <h2>Nova senha</h2>

            <p>
              Digite sua nova senha abaixo
            </p>

            <div className="input-group">
              <input
                type="password"
                placeholder="Nova senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={enviando}>
              {enviando ? "Salvando..." : "Salvar nova senha"}
            </button>

            {message && (
              <p className="success-message">
                {message}
              </p>
            )}

            {error && (
              <p className="error-message">
                {error}
              </p>
            )}

            <div className="register-link">
              <span>Lembrou a senha?</span>

              <Link to="/login">
                {" "}Voltar para login
              </Link>
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