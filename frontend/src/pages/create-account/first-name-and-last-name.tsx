import { Collapse, TextField } from '@mui/material';
import { useState } from 'react';
import { Controller, UseFormReturn } from 'react-hook-form';
import Typewriter from 'typewriter-effect';
import { CreateAccountForm } from './create-account';

export const FirstNameAndLastName = ({
  accountForm
}: {
    accountForm: UseFormReturn<CreateAccountForm>
}) => {
  const [showFirstPhaseInput, setShowFirstPhaseInput] = useState(false);

  return (
    <div className="flex flex-col gap-6 text-center">
        <span className="text-2xl">
          <Typewriter
            options={{ delay: 20, cursor: '' }}
            onInit={(typewriter) => {
              typewriter
                .typeString('Let’s start with the basics.')
                .pauseFor(500)
                .callFunction(() => setShowFirstPhaseInput(true))
                .start();
            }}
          />
        </span>

        <div>
          <Collapse in={showFirstPhaseInput}>
            {showFirstPhaseInput && (
              <>
                <Controller
                  control={accountForm.control}
                  name="firstName"
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      label="First Name"
                      {...field}
                      error={!!accountForm.formState.errors[field.name]}
                      helperText={accountForm.formState.errors[field.name]?.message as string || ' '}
                      size="small"
                      fullWidth
                      autoFocus={true}
                    />
                  )}
                />
              </>
            )}
          </Collapse>

          <Collapse in={showFirstPhaseInput}>
            {showFirstPhaseInput && (
              <Controller
                control={accountForm.control}
                name="lastName"
                rules={{ required: 'First name is required' }}
                render={({ field }) => (
                  <TextField
                    label="Last Name"
                    {...field}
                    error={!!accountForm.formState.errors[field.name]}
                    helperText={accountForm.formState.errors[field.name]?.message as string || ' '}
                    size="small"
                    fullWidth
                  />
                )}
              />
            )}
          </Collapse>
        </div>
      </div>
    )
}   