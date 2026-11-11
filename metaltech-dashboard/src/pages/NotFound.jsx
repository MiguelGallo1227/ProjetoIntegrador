import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-5">
      <h1 className="page-title mb-2">Página não encontrada</h1>
      <p className="text-secondary">O endereço não existe neste painel.</p>
      <Link to="/">Voltar ao painel</Link>
    </div>
  );
}
