import { createFileRoute } from '@tanstack/react-router';
import { ExamPage } from '../../../../../pages/exam';

export const Route = createFileRoute('/_auth/_admin/admin/exam-templates/$examTemplateId')({
  component: ExamTemplateEditPage,
  validateSearch: (search: Record<string, unknown>) => ({
    templateId: search.templateId as string | undefined,
  }),
});

function ExamTemplateEditPage() {
  const { examTemplateId } = Route.useParams();
  const templateId = parseInt(examTemplateId);

  if (isNaN(templateId)) {
    return <div>Invalid template ID</div>;
  }

  return (
    <div className="h-screen">
      <ExamPage examTemplateId={templateId} isEditing={true} />
    </div>
  );
}