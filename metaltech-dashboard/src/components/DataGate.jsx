import { Alert, Spinner, Button } from 'react-bootstrap';
import { useData } from '../context/DataContext';

// Mostra carregando/erro; renderiza children quando ha dados.
export default function DataGate({ children }) {
  const { loading, error, status, reload } = useData();

  if (!status && loading) {
    return (
      <div className="text-center py-5" role="status">
        <Spinner animation="border" size="sm" className="me-2" />
        Carregando dados da esteira…
      </div>
    );
  }
  if (!status && error) {
    return (
      <Alert variant="danger">
        <Alert.Heading as="h2" className="h5">Não foi possível carregar os dados</Alert.Heading>
        <p className="mb-2">{error} Confira se o back-end está rodando e se a URL em Configurações está correta.</p>
        <Button variant="outline-danger" size="sm" onClick={reload}>Tentar novamente</Button>
      </Alert>
    );
  }
  return (
    <>
      {error && (
        <Alert variant="warning" className="py-2">
          A última atualização falhou ({error}). Exibindo os dados anteriores.
        </Alert>
      )}
      {children}
    </>
  );
}
