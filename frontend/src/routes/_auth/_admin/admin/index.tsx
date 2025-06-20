import { createFileRoute, Link } from '@tanstack/react-router';

const Admin = () => {
  return (
    <div className={''}>
      Hello /admin!
      <div className={'flex flex-col'}>
        <Link to={'/admin/routes'} params={{}} search={{}}>
          Rotas
        </Link>

        <Link to={'/admin/events'} params={{}} search={{}}>
          Events
        </Link>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/_admin/admin/')({
  component: () => <Admin />,
});
