import {
  Box,
  Collapse,
  FormControl,
  InputLabel,
  List,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import { TransitionGroup } from 'react-transition-group';
import Typewriter from 'typewriter-effect';
import { CreateAccountForm, Subsidiary } from './create-account';
import { Controller, UseFormReturn } from 'react-hook-form';
import { useState } from 'react';

export const LatamGroup = ({
  accountForm,
  subsidiaries,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
  subsidiaries: Subsidiary[];
}) => {
  const [phrasesSetSubsidiary, setPhrasesSetSubsidiary] = useState<number[]>([
    0,
  ]);

  return (
    <div>
      <List>
        <TransitionGroup>
          {phrasesSetSubsidiary.map((_, index) => (
            <Collapse key={index} className="m-4">
              {index === 0 && phrasesSetSubsidiary.includes(0) && (
                <span className="text-2xl">
<Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(
                        'LATAM is made up of different groups, each with its own story and unique routes.'
                      )
                      .start()
                      .pauseFor(500)
                      .callFunction(() =>
                        setPhrasesSetSubsidiary((prev) => [...prev, 1])
                      );
                  }}
                />
                </span>
                
              )}
              {index === 1 && phrasesSetSubsidiary.includes(1) && (
                <span className="text-2xl">
<Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(
                        'Now’s your chance to pick which group you want to fly for!'
                      )
                      .start()
                      .pauseFor(500)
                      .callFunction(() =>
                        setPhrasesSetSubsidiary((prev) => [...prev, 2])
                      );
                  }}
                />
                </span>
                
              )}
              {index === 2 && phrasesSetSubsidiary.includes(2) && (
                <span className="text-2xl">
<Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(
                        'Once you pick your group, you’ll only be able to fly for that group, just like in real life.'
                      )
                      .start()
                      .pauseFor(500)
                      .callFunction(() =>
                        setPhrasesSetSubsidiary((prev) => [...prev, 3])
                      );
                  }}
                />
                </span>
                
              )}
              {index === 3 &&
                phrasesSetSubsidiary.includes(3) &&
                phrasesSetSubsidiary.includes(3) && (
                    <span className="text-2xl">
<Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(
                          'Don’t worry, you can always change it later if you want.'
                        )
                        .pauseFor(500)
                        .start()
                        .callFunction(() =>
                          setPhrasesSetSubsidiary((prev) => [...prev, 4])
                        );
                    }}
                  />
                    </span>
                  
                )}
              {index === 4 && phrasesSetSubsidiary.includes(4) && (
                <div className="mt-4">
                <Controller
                  control={accountForm.control}
                  name="subsidiaryId"
                  rules={{ required: 'Subsidiary is required' }}
                  render={({ field }) => (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Select Your LATAM Subsidiary</InputLabel>
                      <Select
                        {...field}
                        label="Select Your LATAM Subsidiary"
                        error={!!accountForm.formState.errors[field.name]}
                      >
                        {subsidiaries.map((subsidiary) => (
                          <MenuItem key={subsidiary.id} value={subsidiary.id}>
                            <Box>
                              <Typography variant="body1">
                                {subsidiary.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {subsidiary.icaoCode} -{' '}
                                {subsidiary.bases.length} bases available
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />    
                </div>
                
              )}
            </Collapse>
          ))}
        </TransitionGroup>
      </List>
    </div>
  );
};
