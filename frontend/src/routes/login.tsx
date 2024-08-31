import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Card,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
} from "@mui/material";
import { useAuth } from "../context/auth.context.tsx";
import { Controller, useForm } from "react-hook-form";
import LoadingButton from "@mui/lab/LoadingButton";
import SendIcon from "@mui/icons-material/Send";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type FormData = {
  emailOrUsername: string;
  password: string;
};

function Login() {
  const auth = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    console.log("On submit");
    try {
      setLoading(true);
      await auth.login(data);
    } catch (error) {
      /* empty */
    } finally {
      setLoading(false);
    }
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  return (
    <div className="min-h-full flex flex-col gap-12 justify-center items-center bg-gray-900">
      <img alt={"logo"} src={"/latam-logo.svg"} />
      <Card variant="outlined" className="p-4 shadow">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col gap-2">
            <Controller
              name="emailOrUsername"
              control={control}
              rules={{
                required: "Username or email is required",
              }}
              render={({ field }) => (
                <TextField
                  label="Username or E-mail"
                  {...field}
                  error={!!errors[field.name]}
                  helperText={
                    errors[field.name] ? errors[field.name]?.message : " "
                  }
                  className={errors[field.name] ? "animate-shake" : ""}
                />
              )}
            />
            <Controller
              name="password"
              control={control}
              rules={{
                required: "Password is required",
              }}
              render={({ field }) => (
                <FormControl
                  className={errors[field.name] ? "animate-shake" : ""}
                  error={!!errors[field.name]}
                >
                  <InputLabel htmlFor={`id-${field.name}`}>Password</InputLabel>
                  <OutlinedInput
                    id={`id-${field.name}`}
                    label={"Password"}
                    {...field}
                    type={showPassword ? "text" : "password"}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                          sx={{
                            outline: "none",
                            "&:focus": {
                              outline: "none",
                              boxShadow: "none",
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  ></OutlinedInput>
                  <FormHelperText id={`id-${field.name}-helper-text`}>
                    {errors[field.name] ? errors[field.name]?.message : " "}
                  </FormHelperText>
                </FormControl>
              )}
            />
            <LoadingButton
              type={"submit"}
              variant="contained"
              loadingPosition="end"
              loading={loading}
              endIcon={<SendIcon />}
            >
              Login
            </LoadingButton>
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
