import { useState } from "react";
import { api } from "../../services/api";
import "./styles.css";

export default function AvaliarCarona({ rideId, nomeOutraParte, valor, onConcluir }) {
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviarAvaliacao() {
    if (nota === 0) {
      alert("Selecione uma nota de 1 a 5 estrelas");
      return;
    }

    setEnviando(true);
    try {
      await api.post("/ratings", { rideId, score: nota, comment: comentario || undefined });
    } catch (err) {
      console.error("Erro ao avaliar:", err);
      alert(err.response?.data?.error || "Erro ao enviar avaliação");
    } finally {
      setEnviando(false);
      onConcluir();
    }
  }

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="hero-overlay">
          <div className="login-card avaliacao-card">
            <h2>🎉 Carona finalizada!</h2>

            <div className="pagamento-aviso">
              <p>Valor combinado</p>
              <span className="pagamento-valor">R$ {valor},00</span>
              <p>
                Realize o pagamento diretamente com <strong>{nomeOutraParte}</strong> (dinheiro ou Pix).
              </p>
            </div>

            <h2 style={{ marginTop: 24 }}>Como foi a carona?</h2>
            <p>Avalie {nomeOutraParte}</p>

            <div className="estrelas">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`estrela ${n <= nota ? "ativa" : ""}`}
                  onClick={() => setNota(n)}
                >
                  ★
                </span>
              ))}
            </div>

            <div className="input-group">
              <textarea
                placeholder="Comentário (opcional)"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
              />
            </div>

            <button className="login-btn" onClick={enviarAvaliacao} disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar avaliação"}
            </button>

            <button className="mapa-cancelar" style={{ marginTop: 10, width: "100%" }} onClick={onConcluir}>
              Pular avaliação
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}