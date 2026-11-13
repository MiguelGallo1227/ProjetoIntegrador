import { useMemo, useState } from 'react';
import { Table, Form, Pagination, Button, Row, Col } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import Panel from '../components/Panel';
import { useData } from '../context/DataContext';
import { TIPOS, fmtDateTime } from '../utils/format';
import { rawLabel } from '../utils/sensors';

const PAGE_SIZE = 15;
const cell = (l, k) => (
  <>
    {l[k] ?? '–'} <small className="text-secondary">({rawLabel(l.raw[k], l[k])})</small>
  </>
);

export default function Leituras() {
  const { leituras } = useData();
  const [tipo, setTipo] = useState('TODOS');
  const [pagina, setPagina] = useState(1);

  const filtradas = useMemo(
    () => [...leituras].reverse().filter((l) => tipo === 'TODOS' || l.tipoPeca === tipo),
    [leituras, tipo],
  );
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const atual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((atual - 1) * PAGE_SIZE, atual * PAGE_SIZE);

  const exportarCsv = () => {
    const linhas = ['id;data_hora;indutivo;capacitivo;distancia;tipo_peca'];
    filtradas.forEach((l) =>
      linhas.push(`${l.id};${l.timestamp};${l.indutivo};${l.capacitivo};${l.distancia};${l.tipoPeca ?? ''}`));
    const url = URL.createObjectURL(new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leituras-esteira.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Leituras" subtitle="Valores dos três sensores (convertidos de hexadecimal) e peça classificada">
        <Button variant="outline-primary" size="sm" onClick={exportarCsv} disabled={!filtradas.length}>
          <i className="bi bi-download me-1" aria-hidden="true" />Exportar CSV
        </Button>
      </PageHeader>
      <DataGate>
        <Panel>
          <Row className="mb-3">
            <Col sm={6} md={4}>
              <Form.Group controlId="filtro-tipo">
                <Form.Label>Tipo de peça</Form.Label>
                <Form.Select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(1); }}>
                  <option value="TODOS">Todas</option>
                  <option value="METALICA">Metálicas</option>
                  <option value="NAO_METALICA">Não metálicas</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="table-wrap">
            <Table hover size="sm" className="align-middle">
              <thead><tr><th>#</th><th>Data e hora</th><th>Indutivo</th><th>Capacitivo</th><th>Distância</th><th>Peça</th></tr></thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{fmtDateTime(l.timestamp)}</td>
                    <td>{cell(l, 'indutivo')}</td>
                    <td>{cell(l, 'capacitivo')}</td>
                    <td>{cell(l, 'distancia')}</td>
                    <td>{l.tipoPeca ? TIPOS[l.tipoPeca].label : 'Sem peça'}</td>
                  </tr>
                ))}
                {!visiveis.length && <tr><td colSpan={6} className="text-center text-secondary py-4">Nenhuma leitura para este filtro.</td></tr>}
              </tbody>
            </Table>
          </div>
          <Pagination className="mb-0 justify-content-center flex-wrap">
            <Pagination.Prev disabled={atual === 1} onClick={() => setPagina(atual - 1)} />
            <Pagination.Item active>{atual} / {totalPaginas}</Pagination.Item>
            <Pagination.Next disabled={atual === totalPaginas} onClick={() => setPagina(atual + 1)} />
          </Pagination>
        </Panel>
      </DataGate>
    </>
  );
}
