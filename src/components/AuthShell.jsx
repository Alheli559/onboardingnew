import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { grupoColor } from '../lib/logos'

// Marco común de las pantallas públicas: fondo celeste, tarjeta blanca y logo.
export default function AuthShell({ titulo, sub, children }) {
  return (
    <div className="fp-auth">
      <div className="fp-card">
        <img className="fp-logo" src={grupoColor} alt="Grupo Friopacking" />
        <h1 className="fp-title">{titulo}</h1>
        {sub && <p className="fp-sub">{sub}</p>}
        {children}
      </div>
    </div>
  )
}

export function CampoContrasena({ label, value, onChange, autoComplete, disabled }) {
  const id = useId()
  const [ver, setVer] = useState(false)
  return (
    <div className="fp-field">
      <label htmlFor={id}>{label}</label>
      <div className="fp-pass">
        <input id={id} className="fp-input" type={ver ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} disabled={disabled} />
        <button type="button" className="fp-eye" onClick={() => setVer(v => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {ver ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
    </div>
  )
}

export function Boton({ cargando, textoCargando, children, ...resto }) {
  return (
    <button className="fp-btn" {...resto} disabled={cargando || resto.disabled}>
      {cargando && <span className="fp-spin" aria-hidden="true" />}
      {cargando ? textoCargando : children}
    </button>
  )
}