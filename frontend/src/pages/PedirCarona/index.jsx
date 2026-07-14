import { useContext, useEffect, useRef, useState } from "react";
import "./styles.css";
import logo from "../../assets/logo.png";
import AcompanhamentoMapa from "./AcompanhamentoMapa";
import AvaliarCarona from "./AvaliarCarona";
import { AuthContext } from "../../context/auth";
import { api } from "../../services/api";

const IFAM_COORDS = { lat: -2.627, lng: -56.734 };

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

// geocodifica um endereço em texto pra coordenadas (Nominatim, gratuito, sem chave)
async function geocodificarEndereco(texto) {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(texto + ", Parintins, AM, Brasil")}`
    );
    const data = await resp.json();
    if (data?.[0]) {
      return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
    }
  } catch (err) {
    console.error("Erro ao geocodificar destino:", err);
  }
  return null;
}

const PedirCarona = () => {
  const { user } = useContext(AuthContext);

  const [carona, setCarona] = useState({
    bairro: "",
    rua: "",
    numero: "",
    destino: "IFAM - Campus Parintins",
    enderecoPersonalizado: "",
    valor: "0",
    date: hojeISO(),
    time: "",
  });

  const [coordsOrigem, setCoordsOrigem] = useState(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [etapa, setEtapa] = useState("form"); // "form" | "buscando" | "acompanhando" | "avaliando"
  const [motorista, setMotorista] = useState(null);
  const [posicaoMotorista, setPosicaoMotorista] = useState(null);
  const [posicaoPropria, setPosicaoPropria] = useState(null);
  const [statusCarona, setStatusCarona] = useState("ACEITA");
  const [destinoCoords, setDestinoCoords] = useState(null);
  const [rideId, setRideId] = useState(null);
  const [erro, setErro] = useState("");

  const pollingRef = useRef(null);

  const destinoPersonalizado = carona.destino === "Meu endereço";

  function handleChange(e) {
    setCarona({ ...carona, [e.target.name]: e.target.value });
  }

  function usarLocalizacaoAtual() {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta GPS");
      return;
    }

    setBuscandoGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordsOrigem({ lat: latitude, lng: longitude });

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await resp.json();

          setCarona((prev) => ({
            ...prev,
            bairro: data?.address?.suburb || prev.bairro,
            rua: data?.address?.road || prev.rua,
            numero: data?.address?.house_number || prev.numero,
          }));
        } catch {
          alert("Não foi possível buscar endereço");
        }

        setBuscandoGps(false);
      },
      () => {
        alert("Não foi possível acessar localização");
        setBuscandoGps(false);
      },
      { enableHighAccuracy: true }
    );
  }

  // ---------- Envia o GPS real do próprio aluno enquanto a carona está rolando ----------
  useEffect(() => {
    if ((etapa !== "acompanhando" && etapa !== "buscando") || !rideId || !navigator.geolocation) return;

    let ultimoEnvio = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosicaoPropria({ lat: latitude, lng: longitude });

        const agora = Date.now();
        if (etapa === "acompanhando" && agora - ultimoEnvio > 4000) {
          ultimoEnvio = agora;
          api
            .patch(`/rides/${rideId}/location`, { latitude, longitude })
            .catch((err) => console.error("Erro ao enviar localização:", err));
        }
      },
      (err) => console.error("Erro no GPS:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [etapa, rideId]);

  // ---------- Fica checando o status e a posição real do motorista ----------
  useEffect(() => {
    if ((etapa !== "buscando" && etapa !== "acompanhando") || !rideId) return;

    pollingRef.current = setInterval(async () => {
      try {
        const resp = await api.get("/rides/my");
        const rideAtual = resp.data.find((r) => r.id === rideId);
        if (!rideAtual) return;

        if (etapa === "buscando" && rideAtual.status === "ACEITA" && rideAtual.passenger) {
          const motoristaInfo = rideAtual.passenger;

          setMotorista({
            nome: motoristaInfo.name,
            avatar: motoristaInfo.avatar,
            carro: motoristaInfo.vehicleModel
              ? `${motoristaInfo.vehicleModel} — ${motoristaInfo.vehicleColor || ""}`.trim()
              : "Veículo não informado",
            placa: motoristaInfo.plate || "—",
            nota: "—",
            valorAceito: rideAtual.price,
          });
          setEtapa("acompanhando");
        }

        if (rideAtual.status === "PENDENTE" && etapa === "acompanhando") {
          alert("O motorista desistiu dessa carona. Você voltou pra fila de espera.");
          setMotorista(null);
          setPosicaoMotorista(null);
          setEtapa("buscando");
          return;
        }

        if (rideAtual.status === "FINALIZADA" && etapa === "acompanhando") {
          clearInterval(pollingRef.current);
          setEtapa("avaliando");
          return;
        }

        if (etapa === "acompanhando") {
          setStatusCarona(rideAtual.status);

          if (rideAtual.currentLat && rideAtual.currentLng) {
            setPosicaoMotorista({ lat: rideAtual.currentLat, lng: rideAtual.currentLng });
          }

          if (rideAtual.destinationLatitude && rideAtual.destinationLongitude) {
            setDestinoCoords({ lat: rideAtual.destinationLatitude, lng: rideAtual.destinationLongitude });
          }
        }
      } catch (err) {
        console.error("Erro ao verificar status da carona:", err);
      }
    }, 3000);

    return () => clearInterval(pollingRef.current);
  }, [etapa, rideId]);

  async function solicitarCarona(e) {
    e.preventDefault();
    setErro("");

    const valorNumero = Number(carona.valor);

    if (!carona.bairro.trim()) return alert("Informe seu bairro");
    if (!carona.rua.trim()) return alert("Informe sua rua");
    if (!carona.numero.trim()) return alert("Informe o número da residência");
    if (!carona.time) return alert("Informe o horário desejado");
    if (carona.valor === "" || isNaN(valorNumero)) return alert("Digite a contribuição pela carona");
    if (valorNumero < 0 || valorNumero > 5) return alert("A contribuição deve estar entre R$0,00 e R$5,00");
    if (destinoPersonalizado && !carona.enderecoPersonalizado.trim()) return alert("Informe o endereço de destino");

    const destinoFinal = destinoPersonalizado ? carona.enderecoPersonalizado : carona.destino;
    const origin = `${carona.rua}, ${carona.numero} - ${carona.bairro}`;

    let destinoLatLng = IFAM_COORDS;
    if (destinoPersonalizado) {
      const geocodificado = await geocodificarEndereco(carona.enderecoPersonalizado);
      destinoLatLng = geocodificado || IFAM_COORDS;
    }

    const payload = {
      type: "SOLICITACAO",
      origin,
      destination: destinoFinal,
      bairro: carona.bairro,
      rua: carona.rua,
      numero: carona.numero,
      latitude: coordsOrigem?.lat,
      longitude: coordsOrigem?.lng,
      destinationLatitude: destinoLatLng.lat,
      destinationLongitude: destinoLatLng.lng,
      date: carona.date,
      time: carona.time,
      seats: 1,
      price: valorNumero,
    };

    try {
      const resp = await api.post("/rides", payload);
      setRideId(resp.data.ride.id);
      setDestinoCoords(destinoLatLng);
      setEtapa("buscando");
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao solicitar carona.";
      setErro(msg);
      alert(msg);
    }
  }

  async function cancelarCarona() {
    try {
      if (rideId) {
        await api.patch(`/rides/${rideId}/status`, { status: "CANCELADA" });
      }
    } catch (err) {
      console.error("Erro ao cancelar:", err);
    } finally {
      clearInterval(pollingRef.current);
      setEtapa("form");
      setMotorista(null);
      setPosicaoMotorista(null);
      setRideId(null);
    }
  }

  async function finalizarCarona() {
    try {
      if (rideId) {
        await api.patch(`/rides/${rideId}/finish`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Erro ao finalizar carona.";
      alert(msg);
    } finally {
      clearInterval(pollingRef.current);
      setEtapa("avaliando");
    }
  }

  if (etapa === "avaliando" && motorista) {
    return (
      <AvaliarCarona
        rideId={rideId}
        nomeOutraParte={motorista.nome}
        valor={motorista.valorAceito}
        onConcluir={() => {
          setEtapa("form");
          setMotorista(null);
          setPosicaoMotorista(null);
          setRideId(null);
        }}
      />
    );
  }

  if (etapa === "acompanhando" && motorista) {
    return (
      <AcompanhamentoMapa
        pickup={coordsOrigem || IFAM_COORDS}
        destino={destinoCoords}
        motorista={motorista}
        papel="passageiro"
        status={statusCarona}
        posicaoMotorista={posicaoMotorista}
        posicaoPassageiro={posicaoPropria}
        onCancelar={cancelarCarona}
        onFinalizar={finalizarCarona}
      />
    );
  }

  if (etapa === "buscando") {
    return (
      <main className="login-page">
        <section className="login-hero">
          <div className="hero-overlay">
            <img src={logo} alt="UniRota" className="login-logo-img" />
            <h1>UniRota</h1>

            <div className="login-card buscando-card">
              <div className="spinner"></div>
              <h2>Procurando motorista</h2>
              <p>Aguarde enquanto encontramos alguém próximo...</p>
              <button className="mapa-cancelar" onClick={cancelarCarona} style={{ marginTop: 18 }}>
                Cancelar solicitação
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />

          <h1>UniRota</h1>
          <p className="subtitle">Pedir Carona</p>

          <p className="slogan">
            Encontre alunos indo <br />
            para o mesmo destino.
          </p>

          <form onSubmit={solicitarCarona} className="login-card">
            <h2>Olá, {user?.name?.split(" ")[0] || "aluno"} 👋</h2>
            <p>Informe seu endereço para encontrar uma carona</p>

            <div className="linha-dois-campos">
              <div className="input-group">
                <label>🏘️ Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  placeholder="Ex: Itaúna"
                  value={carona.bairro}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="input-group">
                <label>🔢 Número</label>
                <input
                  type="text"
                  name="numero"
                  placeholder="Ex: 125"
                  value={carona.numero}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>🛣️ Rua</label>
              <div className="campo-com-gps">
                <input
                  type="text"
                  name="rua"
                  placeholder="Nome da rua"
                  value={carona.rua}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="gps-btn"
                  onClick={usarLocalizacaoAtual}
                  disabled={buscandoGps}
                  title="Usar minha localização atual"
                >
                  {buscandoGps ? "..." : "📡"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>🎯 Destino</label>
              <select name="destino" value={carona.destino} onChange={handleChange}>
                <option>IFAM - Campus Parintins</option>
                <option value="Meu endereço">Meu endereço</option>
              </select>
            </div>

            {destinoPersonalizado && (
              <div className="input-group input-group--reveal">
                <label>🏠 Endereço destino</label>
                <input
                  type="text"
                  name="enderecoPersonalizado"
                  placeholder="Rua, número, bairro..."
                  value={carona.enderecoPersonalizado}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="linha-dois-campos">
              <div className="input-group">
                <label>📅 Data</label>
                <input type="date" name="date" value={carona.date} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>🕒 Horário</label>
                <input type="time" name="time" value={carona.time} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>💰 Contribuição pela carona</label>
              <div className="valor-input-wrap">
                <span className="valor-prefixo">R$</span>
                <input
                  type="number"
                  name="valor"
                  min="0"
                  max="5"
                  step="1"
                  placeholder="0 a 5"
                  value={carona.valor}
                  onChange={handleChange}
                  className="valor-input"
                  required
                />
              </div>
              <span className="valor-hint">Valor entre R$0,00 e R$5,00</span>
            </div>

            {erro && <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 10 }}>{erro}</p>}

            <button type="submit" className="login-btn">
              🚗 Solicitar Carona
            </button>
          </form>

          <div className="benefits">
            <div>
              <strong>Seguro</strong>
              <span>Viagens verificadas</span>
            </div>
            <div>
              <strong>Econômico</strong>
              <span>Ajuda no combustível</span>
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

export default PedirCarona;