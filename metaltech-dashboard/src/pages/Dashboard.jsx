import { Row, Col, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import KpiCard from '../components/KpiCard';
import Panel from '../components/Panel';
import ReservoirTank from '../components/ReservoirTank';
import AlertList from '../components/AlertList';
import { LevelChart, ProportionChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { TIPOS, fmtDateTime, fmtTime } from '../utils/format';

export default function Dashboard() {
  const { status, leituras, alertas } = useData();
  const { limiar } = useSettings();
  const total = status ? status.totalMetalicas + status.totalNaoMetalicas : 0;
  const pct = (v) => (total ? `${((v / total) * 100).toFixed(0)}% do total` : '');

  return (
    <>
      <PageHeader
        title="Painel da esteira"
        subtitle={status ? `${status.nome} · última leitura ${fmtDateTime(status.ultimaLeitura)}` : 'Monitoramento em tempo quase real'}
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
            <Row className="g-3 mb-3">
              <Col xs={12} sm={6} xl={3}>
                <KpiCard icon="bi-magnet" label="Peças metálicas (hoje)" value={status.totalMetalicas} hint={pct(status.totalMetalicas)} color={TIPOS.METALICA.color} />
              </Col>
              <Col xs={12} sm={6} xl={3}>
                <KpiCard icon="bi-box" label="Peças não metálicas (hoje)" value={status.totalNaoMetalicas} hint={pct(status.totalNaoMetalicas)} color={TIPOS.NAO_METALICA.color} />
              </Col>
              <Col xs={12} sm={6} xl={3}>
                <KpiCard icon="bi-boxes" label="Total contado (hoje)" value={total} hint="Sensor de distância" />
              </Col>
              <Col xs={12} sm={6} xl={3}>
                <KpiCard icon="bi-bell" label="Alertas no período" value={alertas.length} hint={`Janela de ${leituras.length} leituras`} color="var(--mt-amber)" />
              </Col>
            </Row>

            <Row className="g-3 mb-3">
              <Col lg={4}>
                <Panel title="Reservatório de saída">
                  <ReservoirTank nivel={status.nivelReservatorio} limiar={limiar} />
                </Panel>
              </Col>
              <Col lg={8}>
                <Panel title="Nível do reservatório ao longo do tempo">
                  <LevelChart leituras={leituras} limiar={limiar} />
                </Panel>
              </Col>
            </Row>

            <Row className="g-3">
              <Col lg={4}>
                <Panel title="Metálicas × não metálicas">
                  <ProportionChart metalicas={status.totalMetalicas} naoMetalicas={status.totalNaoMetalicas} />
                </Panel>
              </Col>
              <Col lg={4}>
                <Panel title="Últimas leituras">
                  <div className="table-wrap">
                    <Table size="sm" className="mb-2 align-middle">
                      <thead><tr><th>Hora</th><th>Peça</th><th className="text-end">Nível</th></tr></thead>
                      <tbody>
                        {[...leituras].reverse().slice(0, 6).map((l) => (
                          <tr key={l.id}>
                            <td>{fmtTime(l.timestamp)}</td>
                            <td>{TIPOS[l.tipoPeca].label}</td>
                            <td className="text-end">{l.nivelReservatorio}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                  <Link to="/leituras">Ver todas as leituras</Link>
                </Panel>
              </Col>
              <Col lg={4}>
                <Panel title="Alertas recentes">
                  <AlertList alertas={alertas.slice(0, 3)} />
                  {alertas.length > 3 && <Link to="/alertas">Ver todos os alertas</Link>}
                </Panel>
              </Col>
            </Row>
          </>
        )}
      </DataGate>
    </>
  );
}
