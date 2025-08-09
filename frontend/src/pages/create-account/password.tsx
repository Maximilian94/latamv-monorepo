import { Collapse } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import Typewriter from 'typewriter-effect';
import { CreateAccountForm } from './create-account';
import PasswordInput from '../../components/forms/passwordInput';

export const Password = ({
  accountForm,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
}) => {
  const [showThirdPhaseInput, setShowThirdPhaseInput] = useState(false);

  // Observa a senha para revalidar a confirmação quando ela mudar
  const passwordValue = accountForm.watch('password');

  useEffect(() => {
    // Se o usuário já tocou no confirmPassword, revalida quando a senha mudar
    if (accountForm.getFieldState('confirmPassword').isDirty) {
      accountForm.trigger('confirmPassword');
    }
  }, [passwordValue, accountForm]);

  // Regras de força da senha
  const passwordRules = {
    required: 'Password is required',
    minLength: { value: 8, message: 'At least 8 characters' },
    validate: (value: string) => {
      if (!/[A-Z]/.test(value)) return 'Add at least 1 uppercase letter';
      if (!/[a-z]/.test(value)) return 'Add at least 1 lowercase letter';
      if (!/[0-9]/.test(value)) return 'Add at least 1 number';
      if (!/[^\w\s]/.test(value)) return 'Add at least 1 symbol';
      return true;
    },
  } as const;

  return (
    <div className="flex flex-col gap-6 text-center w-full">
      <span className="text-2xl">
        <Typewriter
          options={{ delay: 20, cursor: '' }}
          onInit={(typewriter) => {
            typewriter
              .typeString('Now, let’s add your password!')
              .pauseFor(500)
              .callFunction(() => setShowThirdPhaseInput(true))
              .start();
          }}
        />
      </span>

      <div>
        <Collapse in={showThirdPhaseInput} unmountOnExit mountOnEnter>
          <Controller
            control={accountForm.control}
            name="password"
            rules={passwordRules}
            render={({ field }) => (
              <div className="mb-4">
                <PasswordInput
                  // seu componente já recebe "errors" + "field"
                  errors={accountForm.formState.errors}
                  field={field}
                  label="Password"
                  size="small"
                  autoComplete="new-password"
                />
              </div>
            )}
          />
        </Collapse>

        <Collapse in={showThirdPhaseInput} unmountOnExit mountOnEnter>
          <Controller
            control={accountForm.control}
            name="confirmPassword"
            rules={{
              required: 'Confirm Password is required',
              validate: (value) =>
                value === accountForm.getValues('password') ||
                'Passwords do not match',
            }}
            render={({ field }) => (
              <div className="mb-4">
                <PasswordInput
                  errors={accountForm.formState.errors}
                  field={field}
                  label="Confirm Password"
                  size="small"
                  autoComplete="new-password"
                />
              </div>
            )}
          />
        </Collapse>
      </div>
    </div>
  );
};
