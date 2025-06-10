import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/resources')({
  component: () => <div>Hello /_auth/resources!</div>,
});
