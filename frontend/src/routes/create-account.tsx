import { createFileRoute } from '@tanstack/react-router';
import { CreateAccountPage } from '../pages/create-account/create-account.tsx';

export const Route = createFileRoute('/create-account')({
  component: CreateAccountPage,
});
