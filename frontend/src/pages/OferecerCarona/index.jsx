import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import logo from "../../assets/logo.png";
import AcompanhamentoMapa from "../PedirCarona/AcompanhamentoMapa";
import AvaliarCarona from "../PedirCarona/AvaliarCarona";
import { AuthContext } from "../../context/auth";
import { api } from "../../services/api";

const IFAM_COORDS = { lat: -2.627, lng: -56.734 };

export default function OferecerCarona() {
  const { user } = useContext(AuthContext);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [passageiroSelecionado, setPassageiroSelecionado] = useState(null);
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [avaliacaoPendente, setAvaliacaoPendente] = useState(null);

  async function carregarSolicitacoes() {
    try {
      setCarregando(true);
      const resp = await api.get("/rides", {
        params: { type: "SOLICITACAO", status: "PENDENTE" },
      });
      setSolicitacoes(resp.data);
      setErro("");
    } catch (err) {
      setErro("Não foi possível carregar as solicitações.");
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSolicitacoes();
  }, []);

  // ---------- Envia a localização real do motorista pro backend enquanto ele estiver a caminho ----------
  useEffect(() => {
    if (!passageiroSelecionado || !navigator.geolocation) return;

    let ultimoEnvio = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosicaoAtual({ lat: latitude, lng: longitude });

        const agora = Date.now();
        if (agora - ultimoEnvio > 4000) {
          ultimoEnvio = agora;
          api
            .patch(`/rides/${passageiroSelecionado.id}/location`, { latitude, longitude })
            .catch((err) => console.error("Erro ao enviar localização:", err));
        }
      },
      (err) => console.error("Erro no GPS:", err),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [passageiroSelecionado]);

  const temVeiculoCadastrado = Boolean(user?.vehicleModel && user?.plate);

  async function aceitarCarona(id) {
    if (!temVeiculoCadastrado) {
      alert("Cadastre seu veículo antes de oferecer carona. Vá em 'Meu Veículo'.");
      return;
    }

    try {
      const resp = await api.patch(`/rides/${id}/accept`);
      const ride = resp.data.ride;

      setPassageiroSelecionado({
        id: ride.id,
        nome: ride.user.name,
        rua: ride.rua,
        numero: ride.numero,
        bairro: ride.bairro,
        destino: ride.destination,
        valor: ride.price,
        latitude: ride.latitude,
        longitude: ride.longitude,
      });
    } catch (err) {
      const msg = err.response?.data?.error || "Não foi possível aceitar essa carona.";
      alert(msg);
      // se alguém já aceitou antes, atualiza a lista pra remover o pedido
      carregarSolicitacoes();
    }
  }

  // ---------- TELA: acompanhando até o aluno ----------
  if (passageiroSelecionado) {
    return (
      <AcompanhamentoMapa
        pickup={{
          lat: passageiroSelecionado.latitude || IFAM_COORDS.lat,
          lng: passageiroSelecionado.longitude || IFAM_COORDS.lng,
        }}
        motorista={{
          nome: passageiroSelecionado.nome,
          carro: user?.vehicleModel
            ? `${user.vehicleModel} — ${user.vehicleColor || ""}`.trim()
            : "Cadastre seu veículo em 'Meu Veículo'",
          placa: user?.plate || "—",
          nota: "—",
          tempoChegadaMin: 6,
          valorAceito: passageiroSelecionado.valor,
        }}
        posicaoAoVivo={posicaoAtual}
        onCancelar={async () => {
          try {
            await api.patch(`/rides/${passageiroSelecionado.id}/cancel-accept`);
          } catch (err) {
            console.error("Erro ao desistir da carona:", err);
          } finally {
            setPassageiroSelecionado(null);
            setPosicaoAtual(null);
            carregarSolicitacoes();
          }
        }}
        onFinalizar={async () => {
          try {
            await api.patch(`/rides/${passageiroSelecionado.id}/finish`);
          } catch (err) {
            const msg = err.response?.data?.error || "Erro ao finalizar carona.";
            alert(msg);
          } finally {
            setAvaliacaoPendente({
              rideId: passageiroSelecionado.id,
              nome: passageiroSelecionado.nome,
              valor: passageiroSelecionado.valor,
            });
            setPassageiroSelecionado(null);
            setPosicaoAtual(null);
          }
        }}
      />
    );
  }

  // ---------- TELA: pagamento + avaliação ----------
  if (avaliacaoPendente) {
    return (
      <AvaliarCarona
        rideId={avaliacaoPendente.rideId}
        nomeOutraParte={avaliacaoPendente.nome}
        valor={avaliacaoPendente.valor}
        onConcluir={() => {
          setAvaliacaoPendente(null);
          carregarSolicitacoes();
        }}
      />
    );
  }

  // ---------- TELA: lista de solicitações ----------
  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <img src={logo} alt="UniRota" className="login-logo-img" />
          <h1>UniRota</h1>
          <p className="subtitle">Solicitações de carona</p>

          {!temVeiculoCadastrado && (
            <div className="login-card aviso-veiculo">
              <p>
                🚗 Você ainda não cadastrou seu veículo. Cadastre antes de aceitar uma carona.
              </p>
              <Link to="/meu-veiculo" className="login-btn" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
                Cadastrar veículo
              </Link>
            </div>
          )}

          {carregando && (
            <div className="login-card buscando-card">
              <div className="spinner"></div>
              <h2>Carregando solicitações</h2>
            </div>
          )}

          {!carregando && erro && (
            <div className="login-card buscando-card">
              <p>{erro}</p>
              <button className="login-btn" onClick={carregarSolicitacoes}>
                Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && solicitacoes.length === 0 && (
            <div className="login-card buscando-card">
              <h2>Nenhuma solicitação no momento</h2>
              <p>Assim que um aluno pedir carona, ela aparece aqui.</p>
              <button className="login-btn" onClick={carregarSolicitacoes} style={{ marginTop: 16 }}>
                Atualizar
              </button>
            </div>
          )}

          {!carregando && !erro && solicitacoes.length > 0 && (
            <div className="lista-carona">
              {solicitacoes.map((item) => (
                <div className="card-solicitacao" key={item.id}>
                  <h2>👤 {item.user?.name}</h2>

                  <div className="rota">
                    <p>
                      📍 <strong>Local de busca:</strong>
                      <br />
                      {item.rua}, {item.numero}
                      <br />
                      Bairro {item.bairro}
                    </p>

                    <p>
                      🎯 <strong>Destino:</strong>
                      <br />
                      {item.destination}
                    </p>
                  </div>

                  <div className="info">
                    <span>💰 R$ {item.price},00</span>
                    <span>{item.latitude ? "📍 GPS disponível" : "📍 Sem GPS"}</span>
                  </div>

                  <button className="login-btn" onClick={() => aceitarCarona(item.id)}>
                    🚗 Oferecer carona
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}