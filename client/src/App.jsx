import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotifProvider } from './context/NotifContext';
import RutaProtegida from './components/RutaProtegida';

import Login from './pages/Login';

import AdminLayout from './pages/admin/AdminLayout';
import AdminInicio from './pages/admin/AdminInicio';
import AdminEmpresas from './pages/admin/AdminEmpresas';
import AdminLocales from './pages/admin/AdminLocales';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminActivaciones from './pages/admin/AdminActivaciones';
import AdminAsignaciones from './pages/admin/AdminAsignaciones';
import AdminLog from './pages/admin/AdminLog';
import AdminEditor from './pages/admin/AdminEditor';
import AdminPedidos from './pages/admin/AdminPedidos';
import AdminCambios from './pages/admin/AdminCambios';
import AdminObjetivos from './pages/admin/AdminObjetivos';
import AdminRepositores from './pages/admin/AdminRepositores';

import GerenteReclamos from './pages/gerente/GerenteReclamos';

import LocalLayout from './pages/local/LocalLayout';
import LocalInicio from './pages/local/LocalInicio';
import LocalPanel from './pages/local/LocalPanel';
import LocalPedidos from './pages/local/LocalPedidos';
import LocalReclamos from './pages/local/LocalReclamos';

import RepositorLayout from './pages/repositor/RepositorLayout';
import RepositorPanel from './pages/repositor/RepositorPanel';
import RepositorActivaciones from './pages/repositor/RepositorActivaciones';
import RepositorCambios from './pages/repositor/RepositorCambios';
import RepositorPedidos from './pages/repositor/RepositorPedidos';
import RepositorReclamos from './pages/repositor/RepositorReclamos';

function App() {
  return (
    <NotifProvider>
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas ADMIN */}
        <Route path="/admin" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminInicio /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/editor" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminEditor /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/locales" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminLocales /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/usuarios" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminUsuarios /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/activaciones" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminActivaciones /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/asignaciones" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminAsignaciones /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/log" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminLog /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/empresas" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminEmpresas /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/pedidos" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminPedidos /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/cambios" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminCambios /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/objetivos" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminObjetivos /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/repositores" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><AdminRepositores /></AdminLayout></RutaProtegida>} />
        <Route path="/admin/reclamos" element={<RutaProtegida rolRequerido="ADMIN"><AdminLayout><GerenteReclamos /></AdminLayout></RutaProtegida>} />

        {/* Rutas LOCAL */}
        <Route path="/local" element={<RutaProtegida rolRequerido="LOCAL"><LocalLayout><LocalInicio /></LocalLayout></RutaProtegida>} />
        <Route path="/local/pedidos" element={<RutaProtegida rolRequerido="LOCAL"><LocalLayout><LocalPedidos /></LocalLayout></RutaProtegida>} />
        <Route path="/local/reclamos" element={<RutaProtegida rolRequerido="LOCAL"><LocalLayout><LocalReclamos /></LocalLayout></RutaProtegida>} />
        <Route path="/local/carteles" element={<RutaProtegida rolRequerido="LOCAL"><LocalLayout><LocalPanel /></LocalLayout></RutaProtegida>} />

        {/* Rutas REPOSITOR */}
        <Route path="/repositor" element={<RutaProtegida rolRequerido="REPOSITOR"><RepositorLayout><RepositorPanel /></RepositorLayout></RutaProtegida>} />
        <Route path="/repositor/activaciones" element={<RutaProtegida rolRequerido="REPOSITOR"><RepositorLayout><RepositorActivaciones /></RepositorLayout></RutaProtegida>} />
        <Route path="/repositor/cambios" element={<RutaProtegida rolRequerido="REPOSITOR"><RepositorLayout><RepositorCambios /></RepositorLayout></RutaProtegida>} />
        <Route path="/repositor/pedidos" element={<RutaProtegida rolRequerido="REPOSITOR"><RepositorLayout><RepositorPedidos /></RepositorLayout></RutaProtegida>} />
        <Route path="/repositor/reclamos" element={<RutaProtegida rolRequerido="REPOSITOR"><RepositorLayout><RepositorReclamos /></RepositorLayout></RutaProtegida>} />

        {/* Raíz → login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
    </NotifProvider>
  );
}

export default App;
