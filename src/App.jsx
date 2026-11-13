import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './auth'
import { calcular } from './lib/calculos'
import { ETAPAS } from './lib/constantes'
import { borrarColaborador, borrarEncuesta, cargarDatos, errorTexto, guardarColaborador, guardarEncuesta } from './lib/datos'
import { hoy, sx } from './lib/utils'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import Filtros from './components/Filtros'
import Dashboard from './components/Dashboard'
import Colaboradores from './components/Colaboradores'
import Usuarios from './components/Usuarios'
import FormColab from './components/FormColab'
import FormEncuesta from './components/FormEncuesta'

const TITULOS = { dash: 'Dashboard de Onboarding', enc: 'Colaboradores en seguimiento', usr: 'Usuarios y roles' }

export default function App() {
  const { estado } = useAuth()
  return estado === 'app' ? <Panel /> : <Login />
}

// Panel principal: solo se muestra con sesión iniciada y un rol asignado.
function Panel() {
  const { perfil, user, puedeEditar, esAdmin, cerrarSesion } = useAuth()
  const [data, setData] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')
  const [tab, setTab] = useState('dash')
  const [etapa, setEtapa] = useState(15)
  const [fSel, setFSel] = useState({ empresa: null, area: null })
  const [modal, setModal] = useState(null) // { tipo: 'colab', colId } | { tipo: 'enc', colId, etapa }
  const [toast, setToast] = useState('')
  const timer = useRef(null)

  const aviso = useCallback(t => {
    clearTimeout(timer.current)
    setToast(t)
    timer.current = setTimeout(() => setToast(''), 2500)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])

  const recargar = useCallback(async () => { setData(await cargarDatos()) }, [])
  useEffect(() => { recargar().catch(e => setErrorCarga(errorTexto(e))) }, [recargar])

  const c = useMemo(() => (data ? calcular(data, etapa, fSel) : null), [data, etapa, fSel])

  // Guardar o borrar en la base y volver a leer los datos para que todo quede al día.
  const ejecutar = async (accion, exito, irAColaboradores) => {
    const msg = await accion()
    if (msg) return msg
    try { await recargar() } catch (e) { return 'Se guardó, pero no se pudo actualizar la vista: ' + errorTexto(e) }
    setModal(null)
    if (irAColaboradores) setTab('enc')
    aviso(exito)
    return null
  }
  const onGuardarColab = p => ejecutar(() => guardarColaborador(p), p.id ? 'Datos del colaborador actualizados' : 'Ingreso registrado', true)
  const onGuardarEnc = p => ejecutar(() => guardarEncuesta(p), 'Encuesta del día ' + p.etapa + ' guardada')
  const onBorrarColab = id => ejecutar(() => borrarColaborador(id), 'Colaborador eliminado')
  const onBorrarEnc = codigo => ejecutar(() => borrarEncuesta(codigo), 'Encuesta eliminada')

  const respaldo = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'onboarding-respaldo-' + hoy() + '.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    aviso('Respaldo descargado')
  }

  if (!data) {
    return (
      <div className="loginwrap">
        <div className="card logincard" style={{ textAlign: 'center' }}>
          {errorCarga ? (
            <>
              <h1 className="disp" style={{ margin: 0, fontSize: 22, color: '#0a1e64' }}>No se pudieron cargar los datos</h1>
              <div className="err" role="alert">{errorCarga}</div>
              <button className="btn pri" onClick={() => { setErrorCarga(''); recargar().catch(e => setErrorCarga(errorTexto(e))) }}>Reintentar</button>
              <button className="btn" onClick={cerrarSesion}>Cerrar sesión</button>
            </>
          ) : <span className="muted">Cargando datos…</span>}
        </div>
      </div>
    )
  }

  const colModal = modal ? data.colaboradores.find(x => x.id === modal.colId) : null
  return (
    <div className="app">
      <div className="shell">
        <Sidebar tab={tab} onTab={setTab} perfil={perfil} esAdmin={esAdmin} puedeEditar={puedeEditar}
          onNuevo={() => { setTab('enc'); setModal({ tipo: 'colab', colId: null }) }} onSalir={cerrarSesion} onRespaldo={respaldo} />
        <main className="mainp">
          <div style={sx('display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap')}>
            <div style={sx('display:flex;flex-direction:column;gap:2px')}>
              <span className="muted" style={sx('font-size:13px')}>Capital Humano · Onboarding</span>
              <h1 className="disp" style={sx('margin:0;font-size:32px;font-weight:700;color:#0a1e64')}>{TITULOS[tab]}</h1>
            </div>
            <div style={sx('display:flex;gap:10px;flex-wrap:wrap;align-items:center')}>
              {tab !== 'usr' && <Filtros data={data} c={c} tab={tab} fSel={fSel} onCambio={setFSel} />}
            </div>
          </div>
          {tab === 'dash' && (
            <div style={sx('display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
              <span className="muted" style={sx('font-size:13px;font-weight:600')}>Etapa</span>
              <div className="seg" role="group" aria-label="Etapa">
                {ETAPAS.map(e => <button key={e} className={'segb' + (e === c.et ? ' on' : '')} aria-pressed={e === c.et} onClick={() => setEtapa(e)}>{e} días</button>)}
              </div>
            </div>
          )}
          {tab === 'dash' && <Dashboard c={c} onEtapa={setEtapa} />}
          {tab === 'enc' && (
            <Colaboradores data={data} c={c} puedeEditar={puedeEditar}
              onNuevo={() => setModal({ tipo: 'colab', colId: null })}
              onEditar={col => setModal({ tipo: 'colab', colId: col.id })}
              onEncuesta={(colId, et) => setModal({ tipo: 'enc', colId, etapa: et })} />
          )}
          {tab === 'usr' && esAdmin && <Usuarios yo={user.id} onAviso={aviso} />}
        </main>
      </div>
      {modal && modal.tipo === 'colab' && (
        <FormColab key={modal.colId || 'nuevo'} col={colModal} data={data} onClose={() => setModal(null)} onGuardar={onGuardarColab} onBorrar={onBorrarColab} />
      )}
      {modal && modal.tipo === 'enc' && colModal && (
        <FormEncuesta key={modal.colId + '-' + modal.etapa} col={colModal} etapa={modal.etapa} puedeEditar={puedeEditar}
          encuesta={data.encuestas.find(x => x.colabId === modal.colId && x.etapa === modal.etapa) || null}
          onClose={() => setModal(null)} onGuardar={onGuardarEnc} onBorrar={onBorrarEnc} />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}