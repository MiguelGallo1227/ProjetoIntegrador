import { Badge } from 'react-bootstrap';
import { rawLabel } from '../utils/sensors';

// Props: nome, icon, color, raw (valor como veio), valor (numero), modo ('presenca' | 'medida'), textoOn, textoOff
export default function SensorCard({ nome, icon, color, raw, valor, modo, textoOn, textoOff }) {
  const ativo = valor > 0;
  return (
    <div className="panel kpi" style={{ '--kpi-color': color }}>
      <div className="kpi-label">
        <i className={`bi ${icon} me-1`} aria-hidden="true" />
        Sensor {nome}
      </div>
      {valor === null ? (
        <div className="kpi-value">–</div>
      ) : modo === 'medida' ? (
        <div className="kpi-value">{valor}</div>
      ) : (
        <div className="mt-2 mb-1">
          <Badge bg={ativo ? 'success' : 'secondary'} className="fs-6">{ativo ? textoOn : textoOff}</Badge>
        </div>
      )}
      <div className="kpi-hint">Valor recebido: <code>{rawLabel(raw, valor)}</code></div>
    </div>
  );
}
