import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const pickupIcon = L.divIcon({
  className: "",
  html: `<div class="pin-pickup"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const destinoIcon = L.divIcon({
  className: "",
  html: `<div class="pin-destino">🏁</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const carroIcon = L.divIcon({
  className: "",
  html: `<div class="pin-carro">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const passageiroIcon = L.divIcon({
  className: "",
  html: `<div class="pin-passageiro">🧍</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// distância em metros entre dois pontos (haversine)
function distanciaMetros(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function AjustarVisao({ pontos }) {
  const map = useMap();

  useEffect(() => {
    if (pontos.length < 2) return;
    const bounds = L.latLngBounds(pontos);
    map.fitBounds(bounds, { padding: [70, 70] });
  }, [pontos, map]);

  return null;
}

/**
 * pickup: {lat, lng} - ponto de embarque
 * destino: {lat, lng} | null - destino final (usado na fase "em viagem")
 * motorista: { nome, carro, placa, nota }
 * papel: "motorista" | "passageiro" — controla o que aparece (botão de iniciar, etc)
 * status: "ACEITA" | "EM_ANDAMENTO" — define a fase do trajeto
 * posicaoMotorista: {lat, lng} | null
 * posicaoPassageiro: {lat, lng} | null
 */
export default function AcompanhamentoMapa({
  pickup,
  destino,
  motorista,
  papel,
  status,
  posicaoMotorista,
  posicaoPassageiro,
  onCancelar,
  onFinalizar,
  onIniciarCorrida,
}) {
  const [rota, setRota] = useState([]);

  const emViagem = status === "EM_ANDAMENTO";
  const pontoAlvo = emViagem ? destino : pickup;

  const temPosicaoMotorista = Boolean(posicaoMotorista);
  const distancia =
    temPosicaoMotorista && pontoAlvo ? distanciaMetros(posicaoMotorista, pontoAlvo) : null;
  const chegouNoAlvo = distancia !== null && distancia < 60;

  // busca a rota real (seguindo ruas) via OSRM sempre que o ponto de origem/alvo mudar de forma relevante
  useEffect(() => {
    if (!temPosicaoMotorista || !pontoAlvo) return;

    const origemRota = posicaoMotorista;
    const controller = new AbortController();

    async function buscarRota() {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origemRota.lng},${origemRota.lat};${pontoAlvo.lng},${pontoAlvo.lat}?overview=full&geometries=geojson`;
        const resp = await fetch(url, { signal: controller.signal });
        const data = await resp.json();

        if (data?.routes?.[0]?.geometry?.coordinates) {
          const coordsLatLng = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setRota(coordsLatLng);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error("Erro ao buscar rota:", err);
      }
    }

    buscarRota();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emViagem, posicaoMotorista?.lat, posicaoMotorista?.lng, pontoAlvo?.lat, pontoAlvo?.lng]);

  // 🔧 CORRIGIDO: texto agora depende do papel do usuário (motorista vê "Localizando passageiro", passageiro vê "Localizando motorista")
  function statusTexto() {
    if (!temPosicaoMotorista) {
      return papel === "motorista" ? "Localizando passageiro..." : "Localizando motorista...";
    }
    if (emViagem) {
      if (chegouNoAlvo) return "🏁 Chegou ao destino!";
      if (distancia < 1000) return `🚗 Em viagem — ${Math.round(distancia)} m até o destino`;
      return `🚗 Em viagem — ${(distancia / 1000).toFixed(1)} km até o destino`;
    }
    if (chegouNoAlvo) return "📍 Motorista chegou no ponto de embarque";
    if (distancia < 1000) return `📍 A ${Math.round(distancia)} m do embarque`;
    return `📍 A ${(distancia / 1000).toFixed(1)} km do embarque`;
  }

  const pontosParaAjustarVisao = [
    [pickup.lat, pickup.lng],
    ...(emViagem && destino ? [[destino.lat, destino.lng]] : []),
    ...(posicaoMotorista ? [[posicaoMotorista.lat, posicaoMotorista.lng]] : []),
  ];

  return (
    <div className="mapa-wrap">
      <MapContainer center={[pickup.lat, pickup.lng]} zoom={15} scrollWheelZoom={false} className="mapa-leaflet">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        {rota.length > 1 && <Polyline positions={rota} pathOptions={{ color: "#138a42", weight: 5, opacity: 0.85 }} />}

        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />

        {emViagem && destino && <Marker position={[destino.lat, destino.lng]} icon={destinoIcon} />}

        {posicaoMotorista && <Marker position={[posicaoMotorista.lat, posicaoMotorista.lng]} icon={carroIcon} />}

        {posicaoPassageiro && !emViagem && (
          <Marker position={[posicaoPassageiro.lat, posicaoPassageiro.lng]} icon={passageiroIcon} />
        )}

        <AjustarVisao pontos={pontosParaAjustarVisao} />
      </MapContainer>

      <div className="mapa-card-motorista">
        <div className="mapa-status">{statusTexto()}</div>

        <div className="mapa-motorista-info">
          <div className="mapa-avatar">{motorista.nome.charAt(0)}</div>

          <div className="mapa-motorista-texto">
            <strong>{motorista.nome}</strong>
            <span>{motorista.carro} · {motorista.placa}</span>
          </div>

          <div className="mapa-nota">⭐ {motorista.nota}</div>
        </div>

        {papel === "motorista" && status === "ACEITA" && (
          <button className="mapa-iniciar" onClick={onIniciarCorrida}>
            🚦 Iniciar corrida
          </button>
        )}

        <div className="mapa-botoes">
          <button className="mapa-cancelar" onClick={onCancelar}>
            Cancelar carona
          </button>

          {onFinalizar && (
            <button
              className="mapa-finalizar"
              onClick={() => {
                if (window.confirm("Confirma que a carona foi concluída?")) {
                  onFinalizar();
                }
              }}
            >
              ✅ Finalizar carona
            </button>
          )}
        </div>
      </div>
    </div>
  );
}