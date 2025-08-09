import {
  CircularProgress,
  Collapse,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Controller, UseFormReturn } from 'react-hook-form';
import { CreateAccountForm } from './create-account';
import Typewriter from 'typewriter-effect';
import { useEffect, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { checkIfUsernameExistsByUsernameOrEmail } from '../../services/latam/latam.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EmailAndUsername = ({
  accountForm,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
}) => {
  const [showInputs, setShowInputs] = useState(false);
  const [validatingUserName, setValidatingUserName] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [isUserNameValid, setIsUserNameValid] = useState<true | null>(null);
  const [isEmailValid, setIsEmailValid] = useState<true | null>(null);
  const [userNameHelperText, setUserNameHelperText] = useState<string | null>(
    null
  );

  const userName = accountForm.watch('userName');

  const validateUserName = useDebouncedCallback(async () => {
    setIsUserNameValid(null);
    setValidatingUserName(true);
    const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(userName))
      .data;
    console.log('isValid', isValid);
    if (!isValid) {
      accountForm.setError('userName', {
        type: 'manual',
        message: 'This username is already in use. Try another one.',
      });
    } else {
      accountForm.clearErrors('userName');
      setIsUserNameValid(true);
    }
    setValidatingUserName(false);
  }, 1000);

  const validateEmail = useDebouncedCallback(async (value: string) => {
    try {
      // Segurança extra: se por acaso chegar aqui sem regex válido, sai
      if (!EMAIL_RE.test(value)) return;
  
      const isAvailable = !(await checkIfUsernameExistsByUsernameOrEmail(value)).data;
  
      if (isAvailable) {
        // Só limpe erro se o erro atual for MANUAL (de disponibilidade)
        const err = accountForm.getFieldState('email').error;
        if (err?.type === 'manual') {
          accountForm.clearErrors('email');
        }
        setIsEmailValid(true);
      } else {
        accountForm.setError('email', {
          type: 'manual',
          message: 'This email is already associated with an account. Please use a different email.',
        });
        setIsEmailValid(null);
      }
    } finally {
      setValidatingEmail(false);
    }
  }, 700);

  useEffect(() => {
    if (userName !== undefined && userName?.trim()) {
      validateUserName();
    }
  }, [userName, validateUserName]);

  useEffect(() => {
    const errosUserName = accountForm.formState.errors.userName;
    if (errosUserName?.message) {
      return setUserNameHelperText(errosUserName?.message as string);
    }
    if (isUserNameValid === true) {
      return setUserNameHelperText('Username is available ✅');
    }
    setUserNameHelperText(null);
  }, [accountForm.formState.errors.userName, isUserNameValid]);

  useEffect(() => {
    accountForm.register('__emailPending');
  }, [accountForm]);

  // Cancelar pendências ao desmontar o step
  useEffect(() => () => validateEmail.cancel(), [validateEmail]);

  return (
    <div className="flex flex-col gap-6 text-center">
      <span className="text-2xl">
        <Typewriter
          options={{ delay: 20, cursor: '' }}
          onInit={(typewriter) => {
            typewriter
              .typeString('Now, let’s add your email and username.')
              .pauseFor(500)
              .callFunction(() => setShowInputs(true))
              .start();
          }}
        />
      </span>

      <div>
        <Collapse in={showInputs}>
          {showInputs && (
            <Controller
              control={accountForm.control}
              name="userName"
              rules={{
                required: 'Username is required',
              }}
              render={({ field }) => (
                <TextField
                  className={`${isUserNameValid ? 'mb-4' : ''}`}
                  label="Username"
                  {...field}
                  error={!!accountForm.formState.errors[field.name]}
                  helperText={userNameHelperText || ' '}
                  size="small"
                  fullWidth
                  autoFocus={true}
                  slotProps={{
                    input: {
                      endAdornment: validatingUserName ? (
                        <InputAdornment position="end">
                          <CircularProgress size={20} color="secondary" />
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                />
              )}
            />
          )}
        </Collapse>

        <Collapse in={showInputs}>
          {showInputs && (
            <>
              <Controller
                control={accountForm.control}
                name="email"
                rules={{
                  required: 'Email is required',
                  pattern: { value: EMAIL_RE, message: 'E-mail inválido' },
                }}
                render={({ field, fieldState }) => {
                  const emailError = fieldState.error; // erro REAL do RHF
                  return (
                    <TextField
                      {...field}
                      label="Email"
                      // pinta de vermelho se estiver validando OU se tiver erro real
                      error={validatingEmail || !!emailError}
                      helperText={
                        validatingEmail
                          ? 'Validating email...'
                          : emailError?.message ||
                            (isEmailValid ? 'Email is available ✅' : ' ')
                      }
                      size="small"
                      fullWidth
                      onChange={(e) => {
                        field.onChange(e);
                        const value = e.target.value; // sem .trim() aqui; deixe o pattern decidir
                      
                        if (!value) {
                          // deixe RHF mostrar 'required' depois; não limpe erros manualmente
                          setValidatingEmail(false);
                          setIsEmailValid(null);
                          validateEmail.cancel();
                          return;
                        }
                      
                        // Se regex falhar, não chame o serviço e não mexa nos erros do RHF
                        if (!EMAIL_RE.test(value)) {
                          setValidatingEmail(false);
                          setIsEmailValid(null);
                          validateEmail.cancel();
                          return;
                        }
                      
                        // OK: formato válido -> pode validar disponibilidade
                        setValidatingEmail(true);
                        validateEmail(value);
                      }}
                      onBlur={() => {
                        field.onBlur();
                        // se o usuário der Enter/blur, força finalizar a validação agora
                        validateEmail.flush();
                      }}
                      slotProps={{
                        input: {
                          endAdornment: validatingEmail ? (
                            <InputAdornment position="end">
                              <CircularProgress size={20} color="secondary" />
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  );
                }}
              />
            </>
          )}
        </Collapse>
      </div>
    </div>
  );
};
