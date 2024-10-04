import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import {
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import PasswordInput from '../components/forms/passwordInput.tsx';
import SendIcon from '@mui/icons-material/Send';
import LoadingButton from '@mui/lab/LoadingButton';
import { useState } from 'react';
import { createUser } from '../services/auth.service.ts';
import { useDebouncedCallback } from 'use-debounce';
import { checkIfUsernameExistsByUsernameOrEmail } from '../services/latam.service.ts';
import { useAuth } from '../context/auth.context.tsx';

interface CreateAccountForm {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  ivaoId: string;
  vatsimId: string;
  password: string;
  confirmPassword: string;
}

const CreateAccount = () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const {
    control,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    handleSubmit,
    register,
  } = useForm<CreateAccountForm>({
    mode: 'onChange',
    defaultValues: {
      userName: '',
      email: '',
      firstName: '',
      lastName: '',
      ivaoId: '',
      vatsimId: '',
      password: '',
      confirmPassword: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [loadingValidationName, setValidationName] = useState(false);
  const [loadingValidationEmail, setValidationEmail] = useState(false);
  const { setUserAndToken } = useAuth();
  const route = useRouter();

  const password = watch('password');
  const ivaoId = watch('ivaoId');
  const vatsimId = watch('vatsimId');
  const username = watch('userName');
  const email = watch('email');
  const firstName = watch('firstName');
  const lastName = watch('lastName');

  const spaceNorAllowed = {
    value: /^\S*$/, // Regex para não permitir espaços
    message: 'Não é permitido usar espaços',
  };
  const onlyNumbers = {
    value: /^[0-9]+$/, // Regex para permitir apenas números
    message: 'Somente números são permitidos',
  };

  const ivaoOrVatsimValidation = () => {
    if (!ivaoId && !vatsimId) {
      setError('ivaoId', {
        message: 'Você precisa estar cadastrado na VATSIM ou IVAO',
      });
      setError('vatsimId', {
        message: 'Você precisa estar cadastrado na VATSIM ou IVAO',
      });
      return 'Você precisa estar cadastrado na VATSIM ou IVAO';
    } else {
      clearErrors('ivaoId');
      clearErrors('vatsimId');
      return true;
    }
  };

  const handlePasswordValidation = (value: string) => {
    if (value !== password) {
      setError('password', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return 'Passwords do not match';
    } else {
      clearErrors('password');
      return true;
    }
  };

  const debounceValidateEmail = useDebouncedCallback(async () => {
    if (errors.email && errors.email.type !== 'manual') {
      return; // Se houver erro de formatação ou outro erro, cancela a requisição
    }

    try {
      setValidationEmail(true);
      const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(email))
        .data;
      if (!isValid) {
        setError('email', {
          type: 'manual',
          message:
            'Este e-mail já está associado a uma conta. Por favor, use um e-mail diferente.',
        });
      } else {
        clearErrors('email');
      }
    } finally {
      setValidationEmail(false);
    }
  }, 1000);

  const debounceValidateUsername = useDebouncedCallback(async () => {
    if (errors.userName && errors.userName.type !== 'manual') {
      return; // Se houver erro de formatação ou outro erro, cancela a requisição
    }

    try {
      setValidationName(true);
      const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(username))
        .data;
      console.log('Validação aqui', isValid);
      if (!isValid) {
        setError('userName', {
          type: 'manual',
          message: 'Este nome de usuário já está em uso. Tente outro.',
        });
      } else {
        clearErrors('userName');
      }
    } finally {
      setValidationName(false);
    }
  }, 1000);

  const onSubmit: SubmitHandler<CreateAccountForm> = async (data) => {
    try {
      setLoading(true);
      const response = await createUser({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        username: data.userName,
      });

      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      route.invalidate();
    } catch (error) {
      console.error('Algum erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={'flex w-full h-screen bg-indigo-900'}>
      <div
        className={
          'w-full max-w-screen-md flex items-center justify-center h-full'
        }
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className={
            'box-border w-full max-h-full flex flex-col gap-1 py-4 px-16 overflow-y-auto overflow-x-hidden'
          }
        >
          <div
            className={'box-border flex justify-center items-center w-full p-4'}
          >
            <img
              alt={'logo'}
              src={'/latam-logo.svg'}
              className={'w-48 max-h-48 my-8'}
            />
          </div>

          <TextField
            label="Username"
            {...register('userName', {
              required: 'Username is required',
              pattern: spaceNorAllowed,
              onChange: debounceValidateUsername,
            })}
            error={!!errors['userName']}
            helperText={errors['userName'] ? errors['userName']?.message : ' '}
            className={errors['userName'] ? 'animate-shake' : ''}
            size={'small'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="start">
                    <CircularProgress
                      disableShrink
                      color={'info'}
                      size={'1rem'}
                      className={loadingValidationName ? '' : 'hidden'}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Email"
            {...register('email', {
              required: 'Email name is required',
              onChange: debounceValidateEmail,
              pattern: {
                value: EMAIL_REGEX,
                message: 'Email inválido', // Mensagem personalizada
              },
            })}
            error={!!errors['email']}
            helperText={errors['email'] ? errors['email']?.message : ' '}
            className={errors['email'] ? 'animate-shake' : ''}
            size={'small'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="start">
                    <CircularProgress
                      disableShrink
                      color={'info'}
                      size={'1rem'}
                      className={loadingValidationEmail ? '' : 'hidden'}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Controller
            control={control}
            name={'firstName'}
            rules={{ required: 'First name is required' }}
            render={({ field }) => (
              <TextField
                label="Firsname"
                {...field}
                error={!!errors[field.name]}
                helperText={
                  errors[field.name] ? errors[field.name]?.message : ' '
                }
                className={errors[field.name] ? 'animate-shake' : ''}
                size={'small'}
              />
            )}
          />

          <Controller
            control={control}
            name={'lastName'}
            rules={{ required: 'last name is required' }}
            render={({ field }) => (
              <TextField
                label="Lastname"
                {...field}
                error={!!errors[field.name]}
                helperText={
                  errors[field.name] ? errors[field.name]?.message : ' '
                }
                className={errors[field.name] ? 'animate-shake' : ''}
                size={'small'}
              />
            )}
          />

          <Controller
            control={control}
            name={'ivaoId'}
            rules={{ validate: ivaoOrVatsimValidation, pattern: onlyNumbers }}
            render={({ field }) => (
              <TextField
                label="IVAO ID"
                {...field}
                error={!!errors[field.name]}
                helperText={
                  errors[field.name] ? errors[field.name]?.message : ' '
                }
                className={errors[field.name] ? 'animate-shake' : ''}
                size={'small'}
              />
            )}
          />

          <Controller
            control={control}
            name={'vatsimId'}
            rules={{ validate: ivaoOrVatsimValidation, pattern: onlyNumbers }}
            render={({ field }) => (
              <TextField
                label="VATSIM ID"
                {...field}
                error={!!errors[field.name]}
                helperText={
                  errors[field.name] ? errors[field.name]?.message : ' '
                }
                className={errors[field.name] ? 'animate-shake' : ''}
                size={'small'}
              />
            )}
          />

          <Controller
            control={control}
            name={'password'}
            rules={{ required: 'Password is required' }}
            render={({ field }) => (
              <PasswordInput errors={errors} field={field} size={'small'} />
            )}
          />

          <Controller
            control={control}
            name={'confirmPassword'}
            rules={{
              required: 'You should confirm your password',
              validate: handlePasswordValidation,
            }}
            render={({ field }) => (
              <PasswordInput
                errors={errors}
                field={field}
                label={'Confirm Password'}
                size={'small'}
              />
            )}
          />

          <Link to={'/login'} params={''} search={undefined}>
            <Typography className={'text-white mt-2'}>
              Already have account ? Click here to login
            </Typography>
          </Link>

          <LoadingButton
            type={'submit'}
            variant="contained"
            loadingPosition="end"
            loading={loading}
            endIcon={<SendIcon />}
            color={'secondary'}
            className={'mt-2'}
          >
            Create Account
          </LoadingButton>
        </form>
      </div>
      <div
        className={'relative w-full bg-cover bg-left'}
        style={{
          backgroundImage:
            "url('https://i2.wp.com/pilotstories.net/wp-content/uploads/2018/01/cockpit2-3-01.jpeg?fit=1920%2C1280&ssl=1')",
        }}
      >
        <div
          className={
            'absolute inset-0 bg-gradient-to-r from-indigo-900/100 via-indigo-900/80 to-indigo-900/60'
          }
        ></div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/create-account')({
  component: CreateAccount,
});
