import { Link } from "react-router-dom";
import "./styles.css";
import logo from "../../assets/logo.png";

export default function Home() {
  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />

          <h1>UniRota</h1>

          <p className="subtitle">CARONA UNIVERSITÁRIA</p>

          <p className="slogan">
            Compartilhe o caminho.
            <br />
            Chegue mais longe juntos.
          </p>

          <div className="home-card">
            <h2>O que deseja fazer?</h2>

            <div className="buttons">
              <Link to="/oferecer-carona" className="home-btn oferecer">
                 Oferecer Carona
              </Link>

              <Link to="/pedir-carona" className="home-btn pedir">
                 Pedir Carona
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}