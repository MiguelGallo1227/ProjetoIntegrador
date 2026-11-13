import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import StatusPill from './StatusPill';

const LINKS = [
  { to: '/', label: 'Painel', icon: 'bi-speedometer2', end: true },
  { to: '/leituras', label: 'Leituras', icon: 'bi-table' },
  { to: '/configuracoes', label: 'Configurações', icon: 'bi-sliders' },
];

export default function NavBar() {
  const { tema, toggleTema } = useSettings();

  return (
    <Navbar expand="md" className="app-navbar" data-bs-theme="dark" collapseOnSelect>
      <Container>
        <Navbar.Brand as={NavLink} to="/" className="brand">
          <i className="bi bi-gear-wide-connected me-2" aria-hidden="true" />
          MetalTech
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="menu-principal" />
        <Navbar.Collapse id="menu-principal">
          <Nav className="me-auto">
            {LINKS.map((l) => (
              <Nav.Link key={l.to} as={NavLink} to={l.to} end={l.end}>
                <i className={`bi ${l.icon} me-1`} aria-hidden="true" />
                {l.label}
              </Nav.Link>
            ))}
          </Nav>
          <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
            <StatusPill />
            <Button variant="outline-light" size="sm" onClick={toggleTema}
              aria-label={tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
              <i className={`bi ${tema === 'dark' ? 'bi-sun' : 'bi-moon-stars'}`} />
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
