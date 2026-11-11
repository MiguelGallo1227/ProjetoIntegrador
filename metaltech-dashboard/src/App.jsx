import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import NavBar from './components/NavBar.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Analises from './pages/Analises.jsx';
import Leituras from './pages/Leituras.jsx';
import Alertas from './pages/Alertas.jsx';
import Configuracoes from './pages/Configuracoes.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <>
      <NavBar />
      <Container as="main" className="py-4">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analises" element={<Analises />} />
          <Route path="/leituras" element={<Leituras />} />
          <Route path="/alertas" element={<Alertas />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <footer className="text-center text-secondary small pb-4">
        MetalTech Indústria e Manufatura · Projeto Interdisciplinar II
      </footer>
    </>
  );
}
