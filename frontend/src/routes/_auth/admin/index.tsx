import { createFileRoute, Link } from '@tanstack/react-router';

const Admin = () => {
  return (
    <div className={''}>
      Hello /admin!
      <Link to={'/admin/routes'} params={{}} search={{}}>
        Rotas
      </Link>
    </div>
  );
};

export const Route = createFileRoute('/_auth/admin/')({
  component: () => <Admin />,
});
