import { useMemo } from 'react';
import { Row, Col, Table } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import DataGate from '../components/DataGate';
import Panel from '../components/Panel';
import BoxPlot from '../components/BoxPlot';
import { CountChart, HistogramChart, ProportionChart } from '../components/Charts';
import { useData } from '../context/DataContext';
import { describe, histogram } from '../utils/stats';
import { fmtNum } from '../utils/format';

const WINDOW = 10; // leituras por janela para contar pecas por tipo

function StatTable({ stats, unit = '' }) {
  const rows = [
    ['Observações', stats.n],
    ['Média', fmtNum(stats.mean, 2)],
    ['Mediana', fmtNum(stats.median, 2)],
    ['Moda', stats.mode ?? '–'],
    ['Desvio padrão', fmtNum(stats.std, 2)],
    ['Mínimo / Máximo', `${fmtNum(stats.min)} / ${fmtNum(stats.max)}`],
    ['Q1 / Q3', `${fmtNum(stats.q1, 2)} / ${fmtNum(stats.q3, 2)}`],
    ['Outliers', stats.outliers.length],
  ];
  return (
    <Table size="sm" className="stat-table mb-0">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}><th scope="row">{k}</th><td>{v}{unit && typeof v === 'string' && !k.includes('/') ? unit : ''}</td></tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function Analises() {
  const { leituras } = useData();

  const dados = useMemo(() => {
    const niveis = leituras.map((l) => l.nivelReservatorio);
    const janelas = [];
    for (let i = 0; i + WINDOW <= leituras.length; i += WINDOW) {
      const fatia = leituras.slice(i, i + WINDOW);
      janelas.push(fatia.filter((l) => l.tipoPeca === 'METALICA').length);
    }
    const metalicas = leituras.filter((l) => l.tipoPeca === 'METALICA').length;
    return {
      nivel: describe(niveis),
      hist: histogram(niveis, 10, 100),
      metalicasJanela: describe(janelas),
      naoMetalicasJanela: describe(janelas.map((m) => WINDOW - m)),
      metalicas,
      naoMetalicas: leituras.length - metalicas,
    };
  }, [leituras]);

  return (
    <>
      <PageHeader title="Análises estatísticas" subtitle={`Estatística descritiva sobre as últimas ${leituras.length} leituras`} />
      <DataGate>
        <Row className="g-3 mb-3">
          <Col lg={6}><Panel title="Contagem acumulada por tipo"><CountChart leituras={leituras} /></Panel></Col>
          <Col lg={6}><Panel title="Proporção metálico × não metálico"><ProportionChart metalicas={dados.metalicas} naoMetalicas={dados.naoMetalicas} /></Panel></Col>
        </Row>
        <Row className="g-3 mb-3">
          <Col lg={6}><Panel title="Histograma do nível do reservatório"><HistogramChart bins={dados.hist} /></Panel></Col>
          <Col lg={6}>
            <Panel title="Boxplot do nível do reservatório">
              <BoxPlot stats={dados.nivel} />
              <p className="small text-secondary mb-0">
                Caixa = Q1 a Q3, traço laranja = mediana, círculos vermelhos = outliers (fora de 1,5 × IQR).
              </p>
            </Panel>
          </Col>
        </Row>
        <Row className="g-3">
          <Col md={6} xl={4}><Panel title="Nível do reservatório (%)"><StatTable stats={dados.nivel} unit="%" /></Panel></Col>
          <Col md={6} xl={4}><Panel title={`Metálicas por ${WINDOW} leituras`}><StatTable stats={dados.metalicasJanela} /></Panel></Col>
          <Col md={12} xl={4}><Panel title={`Não metálicas por ${WINDOW} leituras`}><StatTable stats={dados.naoMetalicasJanela} /></Panel></Col>
        </Row>
      </DataGate>
    </>
  );
}
