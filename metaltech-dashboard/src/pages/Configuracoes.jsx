import { useState } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import { useSettings } from '../context/SettingsContext';

export default function Configuracoes() {
  const { apiUrl, useMock, intervalo, limiar, update, reset } = useSettings();
  const [url, setUrl] = useState(apiUrl);

  return (
    <>
      <PageHeader title="Configurações" subtitle="Conexão com a API e parâmetros de alerta" />
      <Row className="g-3">
        <Col lg={6}>
          <Panel title="Conexão">
            <Form.Check type="switch" id="mock" className="mb-3" label="Usar dados simulados (sem back-end)"
              checked={useMock} onChange={(e) => update({ useMock: e.target.checked })} />
            <Form.Group className="mb-3" controlId="api-url">
              <Form.Label>URL base da API</Form.Label>
              <Form.Control value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8080" disabled={useMock} />
              <Form.Text>Exemplo de requisição: {url || '…'}/api/esteira/status</Form.Text>
            </Form.Group>
            <Button size="sm" disabled={useMock || url === apiUrl} onClick={() => update({ apiUrl: url.trim() })}>Salvar URL</Button>
          </Panel>
        </Col>
        <Col lg={6}>
          <Panel title="Monitoramento">
            <Form.Group className="mb-3" controlId="intervalo">
              <Form.Label>Atualizar a cada: {intervalo} s</Form.Label>
              <Form.Range min={2} max={60} value={intervalo} onChange={(e) => update({ intervalo: Number(e.target.value) })} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="limiar">
              <Form.Label>Limiar de alerta do reservatório: {limiar}%</Form.Label>
              <Form.Range min={50} max={100} value={limiar} onChange={(e) => update({ limiar: Number(e.target.value) })} />
            </Form.Group>
            <Button variant="outline-secondary" size="sm" onClick={() => { reset(); setUrl(''); }}>Restaurar padrões</Button>
          </Panel>
        </Col>
      </Row>
    </>
  );
}
