import { Link, useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/auth";
import "../Login/styles.css";
import logo from "../../assets/logo.png";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState("");
  const [shift, setShift] = useState("");
  const [error, setError] = useState("");

  const { signUp } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    const success = await signUp(
      name,
      email,
      password,
      course,
      shift
    );

    if (success) {
      alert("Cadastro realizado com sucesso!");
      navigate("/login");
    } else {
      setError("Erro ao criar conta. Verifique os dados.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />

          <h1>UniRota</h1>
          <p className="subtitle">Criar conta</p>

          <form onSubmit={handleRegister} className="login-card">
            <h2>Cadastre-se</h2>
            <p>Entre para a comunidade de caronas universitárias</p>

            {error && (
              <p style={{ color: "red", fontSize: "14px" }}>
                {error}
              </p>
            )}

            <div className="input-group">
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="email"
                placeholder="E-mail institucional IFAM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Curso"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                required
              >
                <option value="">Selecione o turno</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
                <option value="Noturno">Noturno</option>
              </select>
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <small style={{ color: "#aaa" }}>
                A senha deve ter no mínimo 6 caracteres
              </small>
            </div>

            <button type="submit" className="login-btn">
              Criar conta
            </button>

            <div className="register-link">
              <span>Já possui conta?</span>
              <Link to="/login"> Entrar</Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};