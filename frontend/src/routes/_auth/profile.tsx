import { createFileRoute } from '@tanstack/react-router';
import UserProfile from '../../components/userProfile.tsx';

export const Route = createFileRoute('/_auth/profile')({
  component: UserProfile,
}); 