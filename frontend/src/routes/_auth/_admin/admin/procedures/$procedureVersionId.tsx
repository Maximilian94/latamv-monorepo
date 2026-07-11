import { createFileRoute } from '@tanstack/react-router';
import { ProceduresEditorPage } from '../../../../../pages/procedures';
import { ProceduresThemeProvider } from '../../../../../pages/procedures/procedures-theme';

export const Route = createFileRoute(
  '/_auth/_admin/admin/procedures/$procedureVersionId'
)({
  component: ProcedureEditorRoute,
});

function ProcedureEditorRoute() {
  const { procedureVersionId } = Route.useParams();
  const versionId = parseInt(procedureVersionId);

  if (isNaN(versionId)) {
    return <div className="p-6">Invalid procedure version ID</div>;
  }

  return (
    <ProceduresThemeProvider>
      <ProceduresEditorPage versionId={versionId} />
    </ProceduresThemeProvider>
  );
}
