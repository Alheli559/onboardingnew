import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { capitalHumano } from '../lib/logos'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '../auth'
import { calcular } from '../lib/calculos'
import { ETAPAS } from '../lib/constantes'
import { borrarColaborador, borrarEncuesta, cargarDatos, errorTexto, guardarColaborador, guardarEncuesta, cambiarTono } from '../lib/datos'
import { hoy, sx } from '../lib/utils'
import Sidebar from './Sidebar'
import Filtros from './Filtros'
import Dashboard from './Dashboard'
import Colaboradores from './Colaboradores'
import FormColab from './FormColab'
import FormEncuesta from './FormEncuesta'

const TITULOS = {
  '/dashboard': 'Dashboard de Onboarding',
  '/colaboradores': 'Colaboradores en seguimiento',
  '/perfil': 'Mi perfil',
  '/usuarios': 'Usuarios',
  '/roles': 'Roles y permisos',
}

// Estructura del panel (menú + encabezado) y datos del dashboard compartidos entre sus páginas.
export default function Panel() {
  const { perfil, rol, esAdmin, puedeEditar, puedeBorrar, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [data, setData] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')
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
  const cargarInicial = useCallback(() => { setErrorCarga(''); recargar().catch(e => setErrorCarga(errorTexto(e))) }, [recargar])
  useEffect(() => { cargarInicial() }, [cargarInicial])

  const c = useMemo(() => (data ? calcular(data, etapa, fSel) : null), [data, etapa, fSel])

  // Guardar o borrar en la base y volver a leer los datos para que todo quede al día.
  const ejecutar = async (accion, exito, irAColaboradores) => {
    const msg = await accion()
    if (msg) return msg
    try { await recargar() } catch (e) { return 'Se guardó, pero no se pudo actualizar la vista: ' + errorTexto(e) }
    setModal(null)
    if (irAColaboradores) navigate('/colaboradores')
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

  const colModal = data && modal ? data.colaboradores.find(x => x.id === modal.colId) : null
  const usaFiltros = !!data && (pathname === '/dashboard' || pathname === '/colaboradores')
  const ctx = {
    data, c, etapa, setEtapa, errorCarga, reintentar: cargarInicial, aviso,
    corregirTono: async (ids, tono) => {
      const msg = await cambiarTono(ids, tono)
      if (msg) return msg
      try { await recargar() } catch (e) { return 'Se guardó, pero no se pudo actualizar la vista: ' + errorTexto(e) }
      aviso('Clasificación actualizada')
      return null
    },
    abrirColab: colId => setModal({ tipo: 'colab', colId }),
    abrirEncuesta: (colId, et) => setModal({ tipo: 'enc', colId, etapa: et }),
  }

  return (
    <div className="app">
      <div className="shell">
        <Sidebar perfil={perfil} rol={rol} esAdmin={esAdmin} puedeEditar={puedeEditar}
          onNuevo={() => { navigate('/colaboradores'); setModal({ tipo: 'colab', colId: null }) }} onSalir={cerrarSesion} onRespaldo={respaldo} />
        <main className="mainp">
          <div style={sx('display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap')}>
            <div style={sx('display:flex;flex-direction:column;gap:2px')}>
              <img src={capitalHumano} alt="Capital Humano" style={{ height: 46, width: 'auto', display: 'block', alignSelf: 'flex-start' }} />
              <h1 className="disp" style={sx('margin:0;font-size:32px;font-weight:700;color:#0a1e64')}>{TITULOS[pathname] || ''}</h1>
            </div>
            <div style={sx('display:flex;gap:10px;flex-wrap:wrap;align-items:center')}>
              {usaFiltros && <Filtros data={data} c={c} tab={pathname === '/dashboard' ? 'dash' : 'enc'} fSel={fSel} onCambio={setFSel} />}
            </div>
          </div>
          <Outlet context={ctx} />
        </main>
      </div>
      {modal && modal.tipo === 'colab' && data && (
        <FormColab key={modal.colId || 'nuevo'} col={colModal} data={data} puedeBorrar={puedeBorrar} onClose={() => setModal(null)} onGuardar={onGuardarColab} onBorrar={onBorrarColab} />
      )}
      {modal && modal.tipo === 'enc' && colModal && (
        <FormEncuesta key={modal.colId + '-' + modal.etapa} col={colModal} etapa={modal.etapa} puedeEditar={puedeEditar} puedeBorrar={puedeBorrar}
          encuesta={data.encuestas.find(x => x.colabId === modal.colId && x.etapa === modal.etapa) || null}
          onClose={() => setModal(null)} onGuardar={onGuardarEnc} onBorrar={onBorrarEnc} />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  )
}

function CargandoDatos() {
  const { errorCarga, reintentar } = useOutletContext()
  return (
    <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {errorCarga ? (
        <>
          <div className="err" role="alert">{errorCarga}</div>
          <button className="btn pri" onClick={reintentar}>Reintentar</button>
        </>
      ) : <span className="muted" role="status">Cargando datos…</span>}
    </div>
  )
}

export function PaginaDashboard() {
  const { data, c, etapa, setEtapa, corregirTono } = useOutletContext()
  const { puedeEditar } = useAuth()
  if (!data) return <CargandoDatos />
  return (
    <>
      <div style={sx('display:flex;align-items:center;gap:12px;flex-wrap:wrap')}>
        <span className="muted" style={sx('font-size:13px;font-weight:600')}>Etapa</span>
        <div className="seg" role="group" aria-label="Etapa">
          {ETAPAS.map(e => <button key={e} className={'segb' + (e === etapa ? ' on' : '')} aria-pressed={e === etapa} onClick={() => setEtapa(e)}>{e} días</button>)}
        </div>
      </div>
      <Dashboard c={c} onEtapa={setEtapa} onCorregirTono={puedeEditar ? corregirTono : null} />
    </>
  )
}

export function PaginaColaboradores() {
  const { data, c, abrirColab, abrirEncuesta } = useOutletContext()
  const { puedeEditar } = useAuth()
  if (!data) return <CargandoDatos />
  return <Colaboradores data={data} c={c} puedeEditar={puedeEditar} onNuevo={() => abrirColab(null)} onEditar={col => abrirColab(col.id)} onEncuesta={abrirEncuesta} />
}