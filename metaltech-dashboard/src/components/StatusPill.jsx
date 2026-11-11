import { useData } from '../context/DataContext';
import { useSettings } from '../context/SettingsContext';
import { fmtTime } from '../utils/format';

export default function StatusPill() {
  const { error, updatedAt } = useData();
  const { useMock } = useSettings();

  let kind = 'live';
  let text = updatedAt ? `Ao vivo · ${fmtTime(updatedAt.toISOString())}` : 'Conectando…';
  if (error) {
    kind = 'off';
    text = 'Sem conexão com a API';
  } else if (useMock) {
    kind = 'demo';
    text = 'Dados simulados';
  }

  return (
    <span className="status-pill" role="status">
      <span className={`status-dot ${kind}`} aria-hidden="true" />
      {text}
    </span>
  );
}
