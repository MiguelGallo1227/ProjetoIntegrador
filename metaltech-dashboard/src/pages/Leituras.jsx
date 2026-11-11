import { useMemo, useState } from 'react';
import { Table, Form, Pagination, Button, Row, Col } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import Panel from '../components/Panel';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { TIPOS, fmtDateTime, nivelTone } from '../utils/format';

const PAGE_SIZE = 15;

export default function Leituras() {
  const { leituras } = useData();
  const { limiar } = useSettings();
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
    const linhas = ['id;data_hora;tipo_peca;nivel_reservatorio'];
    filtradas.forEach((l) => linhas.push(`${l.id};${l.timestamp};${l.tipoPeca};${l.nivelReservatorio}`));
    const url = URL.createObjectURL(new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leituras-esteira.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader title="Leituras" subtitle="Histórico de peças classificadas e nível do reservatório">
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
              <thead><tr><th>#</th><th>Data e hora</th><th>Peça</th><th className="text-end">Nível</th></tr></thead>
              <tbody>
                {visiveis.map((l) => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td>{fmtDateTime(l.timestamp)}</td>
                    <td>
                      <span className="me-2" style={{ color: TIPOS[l.tipoPeca].color }} aria-hidden="true">●</span>
                      {TIPOS[l.tipoPeca].label}
                    </td>
                    <td className={`text-end text-${nivelTone(l.nivelReservatorio, limiar)}`}>{l.nivelReservatorio}%</td>
                  </tr>
                ))}
                {!visiveis.length && <tr><td colSpan={4} className="text-center text-secondary py-4">Nenhuma leitura para este filtro.</td></tr>}
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
