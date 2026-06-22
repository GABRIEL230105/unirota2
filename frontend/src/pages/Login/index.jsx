import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth";
import "./styles.css";
import logo from "../../assets/logo.png";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();

    const success = await signIn(email, password);

    if (success) {
      navigate("/home");
    } else {
      alert("Email ou senha inválidos");
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
            Compartilhe o caminho. <br />
            Chegue mais longe juntos.
          </p>

          <form onSubmit={handleSignIn} className="login-card">
            <h2>Entrar na sua conta</h2>
            <p>Acesse sua conta para continuar</p>

            <div className="input-group">
              <input
                type="email"
                placeholder="E-mail universitário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-options">
              <label>
                <input type="checkbox" />
                Lembrar de mim
              </label>

              <a href="/forgot-password">Esqueceu sua senha?</a>
            </div>

            <button type="submit" className="login-btn">
              Entrar
            </button>

            <div className="register-link">
              <span>Não possui conta?</span>
              <Link to="/register"> Criar conta</Link>
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
