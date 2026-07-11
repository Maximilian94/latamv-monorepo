import { createFileRoute } from '@tanstack/react-router';
import { AircraftAdminPage } from '../../../../pages/aircraft';

export const Route = createFileRoute('/_auth/_admin/admin/aircraft')({
  component: AircraftAdminPage,
});
