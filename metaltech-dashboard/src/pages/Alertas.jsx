import { useState } from 'react';
import { ButtonGroup, ToggleButton } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import Panel from '../components/Panel';
import AlertList from '../components/AlertList';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'danger', label: 'Críticos' },
  { id: 'warning', label: 'Atenção' },
];

export default function Alertas() {
  const { alertas } = useData();
  const { limiar } = useSettings();
  const [filtro, setFiltro] = useState('todos');
  const lista = alertas.filter((a) => filtro === 'todos' || a.severidade === filtro);

  return (
    <>
      <PageHeader title="Alertas" subtitle={`Nível acima de ${limiar}% ou enchimento fora do padrão estatístico`} />
      <DataGate>
        <Panel>
          <ButtonGroup className="mb-3" aria-label="Filtrar alertas">
            {FILTROS.map((f) => (
              <ToggleButton key={f.id} id={`f-${f.id}`} type="radio" variant="outline-secondary" size="sm"
                name="filtro-alertas" value={f.id} checked={filtro === f.id} onChange={() => setFiltro(f.id)}>
                {f.label}
              </ToggleButton>
            ))}
          </ButtonGroup>
          <AlertList alertas={lista} vazio="Nenhum alerta para este filtro." />
        </Panel>
      </DataGate>
    </>
  );
}
