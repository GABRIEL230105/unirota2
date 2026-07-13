import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const pickupIcon = L.divIcon({
  className: "",
  html: `<div class="pin-pickup"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const carroIcon = L.divIcon({
  className: "",
  html: `<div class="pin-carro">🚗</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// distância em metros entre dois pontos (fórmula de haversine)
function distanciaMetros(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function AjustarVisao({ pontoA, pontoB }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([pontoA, pontoB]);
    map.fitBounds(bounds, { padding: [70, 70] });
  }, [pontoA, pontoB, map]);

  return null;
}

/**
 * pickup: {lat, lng} - ponto de embarque
 * motorista: { nome, carro, placa, nota, tempoChegadaMin }
 * posicaoAoVivo: {lat, lng} | null - posição real vinda do backend (polling).
 *   Se vier null/undefined, cai numa simulação só pra não deixar o mapa vazio
 *   enquanto a primeira localização real do motorista ainda não chegou.
 */
export default function AcompanhamentoMapa({ pickup, motorista, posicaoAoVivo, onCancelar, onFinalizar }) {
  const origemSimulada = useRef({
    lat: pickup.lat + 0.007,
    lng: pickup.lng + 0.007,
  });

  const [posicaoSimulada, setPosicaoSimulada] = useState(origemSimulada.current);

  const usandoGpsReal = Boolean(posicaoAoVivo);

  // fallback: só roda a simulação enquanto não tem posição real nenhuma
  useEffect(() => {
    if (usandoGpsReal) return;

    let passo = 0;
    const totalPassos = 30;

    const intervalo = setInterval(() => {
      passo += 1;
      const t = Math.min(passo / totalPassos, 1);

      setPosicaoSimulada({
        lat: lerp(origemSimulada.current.lat, pickup.lat, t),
        lng: lerp(origemSimulada.current.lng, pickup.lng, t),
      });

      if (t >= 1) clearInterval(intervalo);
    }, 700);

    return () => clearInterval(intervalo);
  }, [usandoGpsReal, pickup]);

  const posicaoCarro = usandoGpsReal ? posicaoAoVivo : posicaoSimulada;
  const distancia = usandoGpsReal ? distanciaMetros(posicaoAoVivo, pickup) : null;
  const chegou = distancia !== null && distancia < 60;

  function statusTexto() {
    if (!usandoGpsReal) return "Localizando motorista...";
    if (chegou) return "🚗 Motorista chegou no ponto";
    if (distancia < 1000) return `📍 A ${Math.round(distancia)} m de distância`;
    return `📍 A ${(distancia / 1000).toFixed(1)} km de distância`;
  }

  return (
    <div className="mapa-wrap">
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={15}
        scrollWheelZoom={false}
        className="mapa-leaflet"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />
        <Marker position={[posicaoCarro.lat, posicaoCarro.lng]} icon={carroIcon} />
        <AjustarVisao
          pontoA={[pickup.lat, pickup.lng]}
          pontoB={[posicaoCarro.lat, posicaoCarro.lng]}
        />
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