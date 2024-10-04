import { createFileRoute } from '@tanstack/react-router';

const Main = () => {
  return <div>Teste</div>;
};

export const Route = createFileRoute('/_auth/main')({
  component: Main,
});
