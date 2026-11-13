import { Row, Col, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import KpiCard from '../components/KpiCard';
import SensorCard from '../components/SensorCard';
import Panel from '../components/Panel';
import { CountChart, ProportionChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { TIPOS, fmtDateTime, fmtTime } from '../utils/format';

export default function Dashboard() {
  const { status, leituras, ultima, totalMetalicas, totalNaoMetalicas } = useData();
  const total = totalMetalicas + totalNaoMetalicas;

  return (
    <>
      <PageHeader
        title="Painel da esteira"
        subtitle={status ? `Última leitura em ${fmtDateTime(status.ultimaLeitura ?? ultima?.timestamp)}` : 'Monitoramento em tempo quase real'}
      >
        {status && (
          <Badge bg={status.operando ? 'success' : 'secondary'} className="align-self-center">
            {status.operando ? 'Operando' : 'Parada'}
          </Badge>
        )}
      </PageHeader>

      <DataGate>
        {status && (
          <>
            {ultima && (
              <Row className="g-3 mb-3">
                <Col md={4}>
                  <SensorCard nome="indutivo" icon="bi-magnet" color={TIPOS.METALICA.color} raw={ultima.raw.indutivo}
                    valor={ultima.indutivo} modo="presenca" textoOn="Metal detectado" textoOff="Sem metal" />
                </Col>
                <Col md={4}>
                  <SensorCard nome="capacitivo" icon="bi-box" color={TIPOS.NAO_METALICA.color} raw={ultima.raw.capacitivo}
                    valor={ultima.capacitivo} modo="presenca" textoOn="Material detectado" textoOff="Livre" />
                </Col>
                <Col md={4}>
                  <SensorCard nome="de distância" icon="bi-rulers" color="var(--mt-steel)" raw={ultima.raw.distancia}
                    valor={ultima.distancia} modo="medida" />
                </Col>
              </Row>
            )}

            <Row className="g-3 mb-3">
              <Col sm={4}><KpiCard icon="bi-magnet" label="Metálicas" value={totalMetalicas} color={TIPOS.METALICA.color} /></Col>
              <Col sm={4}><KpiCard icon="bi-box" label="Não metálicas" value={totalNaoMetalicas} color={TIPOS.NAO_METALICA.color} /></Col>
              <Col sm={4}><KpiCard icon="bi-boxes" label="Total de peças" value={total} /></Col>
            </Row>

            <Row className="g-3">
              <Col lg={8}><Panel title="Contagem acumulada por tipo"><CountChart leituras={leituras} /></Panel></Col>
              <Col lg={4}><Panel title="Metálicas × não metálicas"><ProportionChart metalicas={totalMetalicas} naoMetalicas={totalNaoMetalicas} /></Panel></Col>
              <Col xs={12}>
                <Panel title="Últimas leituras">
                  <div className="table-wrap">
                    <Table size="sm" className="mb-2 align-middle">
                      <thead><tr><th>Hora</th><th>Peça</th><th>Indutivo</th><th>Capacitivo</th><th>Distância</th></tr></thead>
                      <tbody>
                        {[...leituras].reverse().slice(0, 6).map((l) => (
                          <tr key={l.id}>
                            <td>{fmtTime(l.timestamp)}</td>
                            <td>{l.tipoPeca ? TIPOS[l.tipoPeca].label : 'Sem peça'}</td>
                            <td>{l.indutivo}</td><td>{l.capacitivo}</td><td>{l.distancia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <Link to="/leituras">Ver todas as leituras</Link>
                </Panel>
              </Col>
            </Row>
          </>
        )}
      </DataGate>
    </>
  );
}
