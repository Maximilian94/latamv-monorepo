import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button, Card, TextField } from "@mui/material";
import { useAuth } from "../context/auth.context.tsx";
import { Controller, useForm } from "react-hook-form";

type FormData = {
  emailOrUsername: string;
  password: string;
};

function Login() {
  const auth = useAuth();
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      await auth.login(data);
    } catch (error) {
      /* empty */
    }
  });

  return (
    <div className="min-h-full flex justify-center items-center bg-gray-900">
      <Card variant="outlined" className="p-4 shadow">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Controller
              name="emailOrUsername"
              control={control}
              render={({ field }) => <TextField label="username" {...field} />}
            />
            <Controller
              name="password"
              control={control}
              render={({ field }) => <TextField label="password" {...field} />}
            />
            <Button type={"submit"} variant="contained">
              Login
            </Button>
          </div>
        </form>
      </Card>
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
