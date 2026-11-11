import { fmtDateTime } from '../utils/format';

const ICON = { danger: 'bi-exclamation-octagon-fill text-danger', warning: 'bi-exclamation-triangle-fill text-warning' };
const TITLE = { NIVEL_CRITICO: 'Nível crítico', ENCHIMENTO_ACELERADO: 'Enchimento acelerado' };

// Props: alertas (array), vazio (texto quando nao ha alertas)
export default function AlertList({ alertas, vazio = 'Nenhum alerta no período analisado.' }) {
  if (!alertas.length) return <p className="text-secondary mb-0">{vazio}</p>;
  return (
    <div>
      {alertas.map((a) => (
        <div className="alert-row" key={a.id}>
          <i className={`bi ${ICON[a.severidade]}`} aria-hidden="true" />
          <div>
            <div className="fw-semibold">{TITLE[a.tipo]}</div>
            <div>{a.mensagem}</div>
            <div className="small text-secondary">{fmtDateTime(a.timestamp)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
