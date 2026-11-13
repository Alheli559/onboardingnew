import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './components/Login'
import Recuperar from './components/Recuperar'
import NuevaContrasena from './components/NuevaContrasena'
import { ProtectedRoute, RoleGuard } from './components/Guardas'
import Panel, { PaginaColaboradores, PaginaDashboard } from './components/Panel'
import Perfil from './components/Perfil'
import Usuarios from './components/Usuarios'
import Roles from './components/Roles'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<Recuperar />} />
      <Route path="/nueva-contrasena" element={<NuevaContrasena />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Panel />}>
          <Route path="/dashboard" element={<PaginaDashboard />} />
          <Route path="/colaboradores" element={<PaginaColaboradores />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route element={<RoleGuard roles={['Admin']} />}>
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/roles" element={<Roles />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}