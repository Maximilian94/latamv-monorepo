import {
  CircularProgress,
  Collapse,
  InputAdornment,
  TextField,
} from '@mui/material';
import { Controller, UseFormReturn } from 'react-hook-form';
import { CreateAccountForm } from './create-account';
import Typewriter from 'typewriter-effect';
import { useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { checkIfUsernameExistsByUsernameOrEmail } from '../../services/latam/latam.service';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EmailAndUsername = ({
  accountForm,
  skipTexts = false
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
  skipTexts?: boolean;
}) => {
  const [showInputs, setShowInputs] = useState(skipTexts);
  const [validatingEmail, setValidatingEmail] = useState(false);

  const userName = accountForm.watch('userName');

  const validateUserName = useDebouncedCallback(async () => {
    const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(userName))
      .data;
    if (!isValid) {
      accountForm.setError('userName', {
        type: 'manual',
        message: 'This username is already in use. Try another one.',
      });
    } else {
      accountForm.clearErrors('userName');
    }
  }, 1000);

  const validateEmail = useDebouncedCallback(async (value: string) => {
    try {
      // Segurança extra: se por acaso chegar aqui sem regex válido, sai
      if (!EMAIL_RE.test(value)) return;

      const isAvailable = !(await checkIfUsernameExistsByUsernameOrEmail(value))
        .data;

      if (isAvailable) {
        // Só limpe erro se o erro atual for MANUAL (de disponibilidade)
        const err = accountForm.getFieldState('email').error;
        if (err?.type === 'manual') {
          accountForm.clearErrors('email');
        }
      } else {
        accountForm.setError('email', {
          type: 'manual',
          message:
            'This email is already associated with an account. Please use a different email.',
        });
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
    accountForm.register('__emailPending');
  }, [accountForm]);

  // Cancelar pendências ao desmontar o step
  useEffect(() => () => validateEmail.cancel(), [validateEmail]);

  const debounceRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const usernameDebounceRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (usernameDebounceRef.current)
        clearTimeout(usernameDebounceRef.current);
    },
    []
  );

  return (
    <div className="flex flex-col gap-6 text-center">
      {!skipTexts && (
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
      )}

      <div>
        <Collapse in={showInputs}>
          {showInputs && (
            <Controller
              control={accountForm.control}
              name="userName"
              rules={{
                required: 'Username is required',
                minLength: { value: 3, message: 'Min. 3 characters' },
                maxLength: { value: 20, message: 'Max. 20 characters' },
                pattern: {
                  value: /^[a-zA-Z0-9._-]+$/,
                  message: 'Use letters, numbers, ".", "_" ou "-"',
                },
                validate: (value: string) => {
                  // só checa disponibilidade se passou nas regras locais
                  if (
                    !value ||
                    value.length < 3 ||
                    value.length > 20 ||
                    !/^[a-zA-Z0-9._-]+$/.test(value)
                  ) {
                    return true; // deixa as outras rules acusarem
                  }
                  // debounce que retorna uma Promise pro RHF
                  return new Promise<string | true>((resolve) => {
                    if (usernameDebounceRef.current)
                      clearTimeout(usernameDebounceRef.current);
                    usernameDebounceRef.current = window.setTimeout(
                      async () => {
                        try {
                          const available = !(
                            await checkIfUsernameExistsByUsernameOrEmail(value)
                          ).data;
                          resolve(
                            available ||
                              'This username is already in use. Try another one.'
                          );
                        } catch {
                          resolve(true); // não bloqueia por erro de rede
                        }
                      },
                      600
                    );
                  });
                },
              }}
              render={({ field, fieldState }) => {
                const showSuccess =
                  fieldState.isDirty &&
                  !fieldState.isValidating &&
                  !fieldState.error;
                return (
                  <TextField
                    {...field}
                    className={'mb-4'}
                    label="Username"
                    error={!!fieldState.error}
                    helperText={
                      fieldState.isValidating
                        ? 'Validating username...'
                        : fieldState.error?.message ||
                          (showSuccess ? 'Username is available ✅' : ' ')
                    }
                    size="small"
                    fullWidth
                    autoFocus={!skipTexts}
                    slotProps={{
                      input: {
                        endAdornment: fieldState.isValidating ? (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ) : null,
                      },
                    }}
                  />
                );
              }}
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
                  pattern: { value: EMAIL_RE, message: 'Invalid email' },
                  validate: (value: string) => {
                    if (!EMAIL_RE.test(value || '')) return true; // deixa o pattern acusar
                    return new Promise<string | true>((resolve) => {
                      if (debounceRef.current)
                        clearTimeout(debounceRef.current);
                      debounceRef.current = window.setTimeout(async () => {
                        try {
                          const available = !(
                            await checkIfUsernameExistsByUsernameOrEmail(value)
                          ).data;
                          resolve(
                            available ||
                              'This email is already associated with an account.'
                          );
                        } catch {
                          resolve(true); // não bloqueia por erro de rede
                        }
                      }, 600);
                    });
                  },
                }}
                render={({ field, fieldState }) => {
                  const value = field.value ?? '';
                  const showSuccess =
                    EMAIL_RE.test(value) &&
                    fieldState.isDirty &&
                    !fieldState.isValidating &&
                    !fieldState.error;

                  return (
                    <TextField
                      {...field}
                      className={'mb-4'}
                      label="Email"
                      // pinta de vermelho se estiver validando OU se tiver erro real
                      error={!!fieldState.error}
                      helperText={
                        fieldState.isValidating
                          ? 'Validating email...'
                          : fieldState.error?.message ||
                            (showSuccess ? 'Email is available ✅' : ' ')
                      }
                      size="small"
                      fullWidth
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
