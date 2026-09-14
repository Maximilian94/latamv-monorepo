import { createFileRoute } from '@tanstack/react-router';
import { ProceduresV2Page } from '../../../../../pages/procedures-v2';

export const Route = createFileRoute('/_auth/_admin/admin/procedures-v2/')({
  component: ProceduresV2Page,
});
