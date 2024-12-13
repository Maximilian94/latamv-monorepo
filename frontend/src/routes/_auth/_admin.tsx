import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/_auth/_admin')({
  component: () => <Outlet />,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(['ACCESS_ADMIN_PANEL'])) {
      toast.error(
        'Você não tem as permissões necessárias para acessar esta página. Entre em contato com o suporte ou volte para a página inicial.'
      );
      throw redirect({ to: '/main' });
    }
  },
});
