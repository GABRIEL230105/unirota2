import { useContext, useEffect, useState } from "react";
import "./styles.css";
import logo from "../../assets/logo.png";
import { AuthContext } from "../../context/auth";
import { api } from "../../services/api";

const MeuVeiculo = () => {
  const { user } = useContext(AuthContext);

  const [veiculo, setVeiculo] = useState({
    vehicleModel: "",
    vehicleColor: "",
    plate: "",
  });

  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (user) {
      setVeiculo({
        vehicleModel: user.vehicleModel || "",
        vehicleColor: user.vehicleColor || "",
        plate: user.plate || "",
      });
    }
  }, [user]);

  function handleChange(e) {
    setVeiculo({ ...veiculo, [e.target.name]: e.target.value });
  }

  async function salvarVeiculo(e) {
    e.preventDefault();
    setMensagem("");

    if (!veiculo.vehicleModel.trim() || !veiculo.vehicleColor.trim() || !veiculo.plate.trim()) {
      alert("Preencha modelo, cor e placa do veículo");
      return;
    }

    setSalvando(true);

    try {
      await api.put("/users/me", veiculo);
      setMensagem("Veículo salvo com sucesso!");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao salvar veículo.";
      setMensagem(msg);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />

          <h1>UniRota</h1>
          <p className="subtitle">Meu Veículo</p>

          <p className="slogan">
            Complete seus dados <br />
            pra oferecer caronas.
          </p>

          <form onSubmit={salvarVeiculo} className="login-card">
            <h2>Dados do veículo</h2>
            <p>Essas informações aparecem pros alunos quando você aceita uma carona</p>

            <div className="input-group">
              <label>🚗 Modelo</label>
              <input
                type="text"
                name="vehicleModel"
                placeholder="Ex: Honda Biz 125"
                value={veiculo.vehicleModel}
                onChange={handleChange}
                required
              />
            </div>

            <div className="linha-dois-campos">
              <div className="input-group">
                <label>🎨 Cor</label>
                <input
                  type="text"
                  name="vehicleColor"
                  placeholder="Ex: Prata"
                  value={veiculo.vehicleColor}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>🔖 Placa</label>
                <input
                  type="text"
                  name="plate"
                  placeholder="ABC-1234"
                  value={veiculo.plate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {mensagem && (
              <p
                style={{
                  fontSize: 13,
                  marginBottom: 10,
                  color: mensagem.includes("sucesso") ? "#138a42" : "#dc2626",
                }}
              >
                {mensagem}
              </p>
            )}

            <button type="submit" className="login-btn" disabled={salvando}>
              {salvando ? "Salvando..." : "💾 Salvar veículo"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default MeuVeiculo;