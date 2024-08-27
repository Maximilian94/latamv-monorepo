import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "@mui/material";
import { useAuth } from "../context/auth.context.tsx";

function Login() {
  const auth = useAuth();
  const router = useRouter();
  const navigate = useNavigate();

  const onSubmit = async () => {
    try {
      await auth.login("123");
      await router.invalidate();
      await navigate({ to: "/main" });
    } catch (error) {
      /* empty */
    }
  };
  return (
    <div>
      Hello /login!
      <Button onClick={onSubmit}>Log In</Button>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: "/main" });
    }
  },
  component: Login,
});
