import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { TextField, Typography } from '@mui/material';
import { useAuth } from '../context/auth.context.tsx';
import { Controller, useForm } from 'react-hook-form';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { useState } from 'react';
import { PasswordInput } from '../components/forms/passwordInput.tsx';

type FormData = {
  emailOrUsername: string;
  password: string;
};

function Login() {
  const auth = useAuth();
  const route = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    console.log('On submit');
    try {
      setLoading(true);
      const response = await auth.login(data);
      if (response) await route.navigate({ to: '/main' });
    } catch (error) {
      /* empty */
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-full flex flex-col gap-12 justify-center items-center bg-indigo-900">
      <img alt={'logo'} src={'/latam-logo.svg'} />
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Controller
            name="emailOrUsername"
            control={control}
            rules={{
              required: 'Username or email is required',
            }}
            render={({ field }) => (
              <TextField
                label="Username or E-mail"
                {...field}
                error={!!errors[field.name]}
                helperText={
                  errors[field.name] ? errors[field.name]?.message : ' '
                }
                className={errors[field.name] ? 'animate-shake' : ''}
                size={`small`}
              />
            )}
          />
          <Controller
            name="password"
            control={control}
            rules={{
              required: 'Password is required',
            }}
            render={({ field }) => (
              <PasswordInput field={field} errors={errors} size={`small`} />
            )}
          />

          <Link to={'/create-account'} params={''} search={undefined}>
            <Typography className={'text-white mt-2'}>
              Dont have account ? Click here to register
            </Typography>
          </Link>

          <LoadingButton
            type={'submit'}
            variant="contained"
            loadingPosition="end"
            loading={loading}
            endIcon={<SendIcon />}
            color={'secondary'}
          >
            Login
          </LoadingButton>
        </div>
      </form>
    </div>
  );
}

export const Route = createFileRoute('/login')({
  component: Login,
});
