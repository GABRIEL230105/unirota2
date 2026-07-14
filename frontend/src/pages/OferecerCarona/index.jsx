import { useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";
import logo from "../../assets/logo.png";
import AcompanhamentoMapa from "../PedirCarona/AcompanhamentoMapa";
import AvaliarCarona from "../PedirCarona/AvaliarCarona";
import { AuthContext } from "../../context/auth";
import { api } from "../../services/api";

const IFAM_COORDS = { lat: -2.627, lng: -56.734 };
const TEMPO_LIMITE_SEGUNDOS = 15;

export default function OferecerCarona() {
  const { user } = useContext(AuthContext);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [passageiroSelecionado, setPassageiroSelecionado] = useState(null);
  const [posicaoAtual, setPosicaoAtual] = useState(null);
  const [avaliacaoPendente, setAvaliacaoPendente] = useState(null);

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(TEMPO_LIMITE_SEGUNDOS);

  async function carregarSolicitacoes() {
    try {
      setCarregando(true);
      const resp = await api.get("/rides", {
        params: { type: "SOLICITACAO", status: "PENDENTE" },
      });
      setSolicitacoes(resp.data);
      setIndiceAtual(0);
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

  // ---------- Cronômetro do pedido em exibição ----------
  useEffect(() => {
    setSegundosRestantes(TEMPO_LIMITE_SEGUNDOS);

    if (indiceAtual >= solicitacoes.length) return;

    const intervalo = setInterval(() => {
      setSegundosRestantes((atual) => {
        if (atual <= 1) {
          setIndiceAtual((i) => i + 1);
          return TEMPO_LIMITE_SEGUNDOS;
        }
        return atual - 1;
      });
    }, 1000);

    return () => clearInterval(intervalo);
  }, [indiceAtual, solicitacoes.length]);

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

  function rejeitarAtual() {
    setIndiceAtual((i) => i + 1);
  }

  const circunferencia = 2 * Math.PI * 16;
  const offsetCronometro = useMemo(
    () => circunferencia * (1 - segundosRestantes / TEMPO_LIMITE_SEGUNDOS),
    [segundosRestantes]
  );

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

  const pedidoAtual = solicitacoes[indiceAtual];

  // ---------- TELA: pedido atual (um por vez, estilo app de transporte) ----------
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

          {!carregando && !erro && solicitacoes.length > 0 && !pedidoAtual && (
            <div className="login-card buscando-card">
              <h2>Você viu todos os pedidos</h2>
              <p>Não sobrou nenhuma solicitação pendente na fila.</p>
              <button className="login-btn" onClick={carregarSolicitacoes} style={{ marginTop: 16 }}>
                Atualizar
              </button>
            </div>
          )}

          {!carregando && !erro && pedidoAtual && (
            <div className="pedido-card">
              <div className="pedido-topo">
                <div className="pedido-rota-mini">
                  <span className="mini-ponto origem" />
                  <span className="mini-linha" />
                  <span className="mini-ponto destino" />
                </div>
                <button className="pedido-rejeitar" onClick={rejeitarAtual} aria-label="Rejeitar pedido">
                  ✕ Rejeitar
                </button>
              </div>

              <div className="pedido-selo-linha">
                <span className="pedido-selo">🎓 Comunidade acadêmica</span>
                <span className="pedido-selo">
                  {pedidoAtual.latitude ? "📍 GPS ativo" : "📍 Sem GPS"}
                </span>
              </div>

              <h2 className="pedido-nome">{pedidoAtual.user?.name}</h2>

              <div className="pedido-valor">
                {pedidoAtual.price ? `R$ ${Number(pedidoAtual.price).toFixed(2)}` : "Carona solidária"}
              </div>

              <div className="pedido-endereco">
                <div className="endereco-trilho">
                  <span className="endereco-ponto embarque" />
                  <span className="endereco-linha" />
                  <span className="endereco-ponto destino" />
                </div>

                <div className="endereco-textos">
                  <div>
                    <p className="endereco-label">Embarque</p>
                    <p className="endereco-valor">
                      {pedidoAtual.rua}, {pedidoAtual.numero} — Bairro {pedidoAtual.bairro}
                    </p>
                  </div>
                  <div>
                    <p className="endereco-label">Destino</p>
                    <p className="endereco-valor">{pedidoAtual.destination}</p>
                  </div>
                </div>
              </div>

              <button className="pedido-aceitar" onClick={() => aceitarCarona(pedidoAtual.id)}>
                <span>Aceitar carona</span>
                <span className="pedido-timer">
                  <svg viewBox="0 0 36 36" className="timer-svg">
                    <circle cx="18" cy="18" r="16" className="timer-fundo" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      className="timer-progresso"
                      style={{ strokeDasharray: circunferencia, strokeDashoffset: offsetCronometro }}
                    />
                  </svg>
                  <span className="timer-numero">{segundosRestantes}s</span>
                </span>
              </button>

              {solicitacoes.length > 1 && (
                <p className="pedido-contador">
                  Pedido {indiceAtual + 1} de {solicitacoes.length}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}