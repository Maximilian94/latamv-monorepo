import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import toast from 'react-hot-toast';

export const Route = createFileRoute('/_auth/_admin')({
  component: () => <Outlet />,
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission(['ACCESS_ADMIN_PANEL'])) {
      toast.error(
        'You do not have the necessary permissions to access this page. Contact support or return to the home page.'
      );
      throw redirect({ to: '/main' });
    }
  },
});
