import { Collapse, List, TextField } from '@mui/material';
import { TransitionGroup } from 'react-transition-group';
import Typewriter from 'typewriter-effect';
import { CreateAccountForm } from './create-account';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useState } from 'react';

export const OnlineFlying = ({
  accountForm,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
}) => {
  const [phrasesSetOnlineFlying, setPhrasesSetOnlineFlying] = useState<
    number[]
  >([0]);

  return (
    <div>
      <List>
        <TransitionGroup>
          {phrasesSetOnlineFlying.map((_, index) => (
            <Collapse key={index} className="m-4" mountOnEnter unmountOnExit>
              {index === 0 && phrasesSetOnlineFlying.includes(0) && (
                <span className="text-2xl">
                  <Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(
                          'We encourage all our members to fly online — it’s much more fun and professional'
                        )
                        .start()
                        .pauseFor(500)
                        .callFunction(() =>
                          setPhrasesSetOnlineFlying((prev) => [...prev, 1])
                        );
                    }}
                  />
                </span>
              )}

              {index === 1 && phrasesSetOnlineFlying.includes(1) && (
                <span className="text-2xl">
                  <Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(
                          'To join LATAM Virtual, you’ll need at least one online network ID (IVAO or VATSIM).'
                        )
                        .start()
                        .pauseFor(500)
                        .callFunction(() =>
                          setPhrasesSetOnlineFlying((prev) => [...prev, 2])
                        );
                    }}
                  />
                </span>
              )}

              {index === 2 && phrasesSetOnlineFlying.includes(2) && (
                <>
                  {/* IVAO ID */}
                  <Controller
                    control={accountForm.control}
                    name="ivaoId"
                    rules={{
                      validate: (value: string) => {
                        const v = (value ?? '').trim();
                        const other = (
                          accountForm.getValues('vatsimId') ?? ''
                        ).trim();

                        // precisa de pelo menos um preenchido
                        if (!v && !other) return 'Provide IVAO ID or VATSIM ID';

                        // se este campo foi preenchido, tem que ser só números
                        if (v && !/^\d+$/.test(v)) return 'Only numbers';

                        // se este ficou vazio, deixamos o erro (se houver) pro campo VATSIM aparecer lá
                        return true;
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        label="IVAO ID"
                        {...field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || ' '}
                        size="small"
                        fullWidth
                        onChange={(e) => {
                          field.onChange(e);
                          // revalida o "irmão" para limpar/mostrar mensagem corretamente
                          accountForm.trigger('vatsimId');
                        }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        autoComplete="off"
                      />
                    )}
                  />

                  {/* VATSIM ID */}
                  <Controller
                    control={accountForm.control}
                    name="vatsimId"
                    rules={{
                      validate: (value: string) => {
                        const v = (value ?? '').trim();
                        const other = (
                          accountForm.getValues('ivaoId') ?? ''
                        ).trim();

                        if (!v && !other) return 'Provide IVAO ID or VATSIM ID';
                        if (v && !/^\d+$/.test(v)) return 'Only numbers';

                        return true;
                      },
                    }}
                    render={({ field, fieldState }) => (
                      <TextField
                        label="VATSIM ID"
                        {...field}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message || ' '}
                        size="small"
                        fullWidth
                        onChange={(e) => {
                          field.onChange(e);
                          accountForm.trigger('ivaoId');
                        }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        autoComplete="off"
                      />
                    )}
                  />
                </>
              )}
            </Collapse>
          ))}
        </TransitionGroup>
      </List>
    </div>
  );
};
