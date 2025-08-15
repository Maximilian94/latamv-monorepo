import { createFileRoute } from '@tanstack/react-router'
import { ExamPage } from '../../../../../pages/exam'

export const Route = createFileRoute('/_auth/_admin/admin/exam-templates/create-exam-template')({
  component: () => <ExamPage isEditing={true} />
})