// Ventana de confirmación para eliminar (encuesta o colaborador).
export default function Confirmar({ titulo, texto, busy, error, onCancelar, onConfirmar }) {
  return (
    <div className="modalwrap center">
      <button className="scrim" aria-label="Cancelar" onClick={onCancelar} />
      <div className="modal narrow" role="alertdialog" aria-modal="true" aria-labelledby="ct">
        <div className="mbody">
          <h2 id="ct" className="disp" style={{ margin: 0, fontSize: 20, color: '#0a1e64' }}>{titulo}</h2>
          {error && <div className="err" role="alert">{error}</div>}
          <p style={{ margin: 0 }}>{texto}</p>
        </div>
        <div className="mfoot">
          <button className="btn" onClick={onCancelar}>Cancelar</button>
          <button className="btn dangerpri" onClick={onConfirmar} disabled={busy}>{busy ? 'Eliminando…' : 'Sí, continuar'}</button>
        </div>
      </div>
    </div>
  )
}