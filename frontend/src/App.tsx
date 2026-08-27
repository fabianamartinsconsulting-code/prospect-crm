import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Prospeccao from './pages/Prospeccao';
import Leads from './pages/Leads';
import Empresas from './pages/Empresas';
import Contatos from './pages/Contatos';
import Pipeline from './pages/Pipeline';
import Representacoes from './pages/Representacoes';
import Inteligencia from './pages/Inteligencia';
import Atividades from './pages/Atividades';
import Configuracoes from './pages/Configuracoes';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <p>Carregando...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="prospeccao" element={<Prospeccao />} />
            <Route path="leads" element={<Leads />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="contatos" element={<Contatos />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="representacoes" element={<Representacoes />} />
            <Route path="inteligencia" element={<Inteligencia />} />
            <Route path="atividades" element={<Atividades />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
