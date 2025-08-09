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

export const Base = ({
  accountForm,
  selectedSubsidiary,
}: {
  accountForm: UseFormReturn<CreateAccountForm>;
  selectedSubsidiary: Subsidiary | null;
}) => {
  const [phrasesSetBase, setPhrasesSetBase] = useState<number[]>([0]);

  return (
    <div>
      <List>
        <TransitionGroup>
          {phrasesSetBase.map((_, index) => (
            <Collapse key={index} className="m-4">
              {index === 0 && phrasesSetBase.includes(0) && (
                <span className="text-2xl">
                  {' '}
                  <Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString('Every pilot needs a base of operations.')
                        .start()
                        .pauseFor(500)
                        .callFunction(() =>
                          setPhrasesSetBase((prev) => [...prev, 1])
                        );
                    }}
                  />
                </span>
              )}
              {index === 1 && phrasesSetBase.includes(1) && (
                <span className="text-2xl">
                  <Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(
                          'Your flight roster will always start and end at this base, just like in real airlines.'
                        )
                        .start()
                        .pauseFor(500)
                        .callFunction(() =>
                          setPhrasesSetBase((prev) => [...prev, 2])
                        );
                    }}
                  />
                </span>
              )}
              {index === 2 && phrasesSetBase.includes(2) && (
                <span className="text-2xl">
                  <Typewriter
                    options={{ delay: 20, cursor: '' }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(
                          'But relax: you can switch your base whenever you want.'
                        )
                        .start()
                        .pauseFor(500)
                        .callFunction(() =>
                          setPhrasesSetBase((prev) => [...prev, 3])
                        );
                    }}
                  />
                </span>
              )}
              {index === 3 && phrasesSetBase.includes(3) && (
                <Controller
                  control={accountForm.control}
                  name="baseId"
                  rules={{ required: 'Base is required' }}
                  render={({ field }) => (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Select Your Base</InputLabel>
                      <Select
                        {...field}
                        label="Select Your Base"
                        error={!!accountForm.formState.errors[field.name]}
                        displayEmpty
                        disabled={
                          !selectedSubsidiary ||
                          selectedSubsidiary.bases.length === 0
                        }
                        renderValue={(val) =>
                          val == null ? (
                            <span className="text-gray-400">Select...</span>
                          ) : (
                            selectedSubsidiary?.bases.find(
                              (base) => base.id === val
                            )?.city || val
                          )
                        }
                      >
                        <MenuItem value="">
                          <em>Select...</em>
                        </MenuItem>
                        {selectedSubsidiary?.bases.map((base) => (
                          <MenuItem key={base.id} value={base.id}>
                            <Box>
                              <Typography variant="body1">
                                {base.city}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {base.baseAirports.map((baseAirport, index) => (
                                  <span key={baseAirport.id}>
                                    {baseAirport.airportCode}{' '}
                                    {base.baseAirports.length > 1 &&
                                    index !== base.baseAirports.length - 1
                                      ? ', '
                                      : ''}
                                  </span>
                                ))}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              )}
            </Collapse>
          ))}
        </TransitionGroup>
      </List>
    </div>
  );
};
