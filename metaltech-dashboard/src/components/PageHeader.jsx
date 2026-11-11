import { Button } from 'react-bootstrap';
import { useData } from '../context/DataContext';

// Props: title (string), subtitle (string), children (acoes extras)
export default function PageHeader({ title, subtitle, children }) {
  const { reload, loading } = useData();
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      <div className="d-flex gap-2">
        {children}
        <Button variant="outline-secondary" size="sm" onClick={reload} disabled={loading}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
          Atualizar agora
        </Button>
      </div>
    </div>
  );
}
