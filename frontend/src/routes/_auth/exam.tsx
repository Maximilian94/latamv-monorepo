import { createFileRoute } from '@tanstack/react-router';
import { ExamPage } from '../../pages/exam';

export const Route = createFileRoute('/_auth/exam')({
  component: ExamPage,
});
