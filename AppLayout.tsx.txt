import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MENU = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/prospeccao', label: 'Prospecção' },
  { to: '/leads', label: 'Leads' },
  { to: '/empresas', label: 'Empresas' },
  { to: '/contatos', label: 'Contatos' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/representacoes', label: 'Representações' },
  { to: '/inteligencia', label: 'Inteligência' },
  { to: '/atividades', label: 'Atividades' },
  { to: '/configuracoes', label: 'Configurações' },
];

export default function AppLayout() {
  const { signOut } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Prospecção B2B</div>
        <nav>
          {MENU.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="signout" onClick={signOut}>Sair</button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
