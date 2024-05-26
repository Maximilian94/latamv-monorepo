import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/main")({
  component: () => Main,
});

const Main: React.FC = () => {
  return <div>Teste</div>;
};
