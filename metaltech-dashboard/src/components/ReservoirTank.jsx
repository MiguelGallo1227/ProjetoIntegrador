import { Badge } from 'react-bootstrap';
import { nivelTone, TONE_LABEL, fmtNum } from '../utils/format';

// Props: nivel (0-100), limiar (0-100)
export default function ReservoirTank({ nivel, limiar }) {
  const tone = nivelTone(nivel, limiar);
  return (
    <div className="tank-wrap">
      <div
        className="tank"
        role="img"
        aria-label={`Reservatório com ${fmtNum(nivel)}% de ocupação, limiar de alerta em ${limiar}%`}
      >
        <div className={`tank-fill tone-${tone}`} style={{ height: `${Math.min(100, nivel)}%` }} />
        <div className="tank-limit" style={{ bottom: `${limiar}%` }}>
          <span>{limiar}%</span>
        </div>
      </div>
      <div>
        <div className="tank-readout">{fmtNum(nivel)}%</div>
        <div className="text-secondary mb-2">do reservatório de saída ocupado</div>
        <Badge bg={tone} text={tone === 'warning' ? 'dark' : undefined}>{TONE_LABEL[tone]}</Badge>
      </div>
    </div>
  );
}
