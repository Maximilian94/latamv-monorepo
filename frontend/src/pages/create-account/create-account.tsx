import { useRouter } from '@tanstack/react-router';
import {
  Button,
  TextField,
  Typography,
  Box,
  List,
  Collapse,
  SelectChangeEvent,
} from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import PasswordInput from '../../components/forms/passwordInput.tsx';
import SendIcon from '@mui/icons-material/Send';
import LoadingButton from '@mui/lab/LoadingButton';
import { useState, useEffect, useCallback } from 'react';
import { createUser } from '../../services/auth.service.ts';
import { useDebouncedCallback } from 'use-debounce';
import { checkIfUsernameExistsByUsernameOrEmail } from '../../services/latam/latam.service.ts';
import { useAuth } from '../../context/auth.context.tsx';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import api from '../../services/api.ts';
import { TransitionGroup } from 'react-transition-group';
import Typewriter from 'typewriter-effect';
import { FirstNameAndLastName } from './first-name-and-last-name.tsx';
import { EmailAndUsername } from './email-and-user-name.tsx';
import { PhaseWrapper } from './phase-wrapper.tsx';
import { Password } from './password.tsx';
import { LatamGroup } from './latam-group.tsx';

enum Phase {
  FIRST_NAME_AND_LAST_NAME = 3,
  EMAIL_AND_USERNAME = 4,
  PASSWORD = 5,
  SUBSIDIARY = 6,
  BASE = 7,
  ONLINE_FLYING = 8,
  REGISTRATION_COMPLETE = 9,
}

export interface CreateAccountForm {
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  ivaoId: string;
  vatsimId: string;
  password: string;
  confirmPassword: string;
  baseId: number;
  subsidiaryId: number;
  acceptTerms: boolean;
  __emailPending: boolean;
}

export interface Subsidiary {
  id: number;
  name: string;
  code: string;
  icaoCode: string;
  bases: Base[];
}

interface Base {
  id: number;
  name: string;
  city: string;
  state: string;
  baseAirports: BaseAirport[];
}

interface BaseAirport {
  id: number;
  airportCode: string;
}

export const CreateAccountPage: React.FC = () => {
  const accountForm = useForm<CreateAccountForm>({
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
      baseId: 1,
      subsidiaryId: 1,
      acceptTerms: false,
      __emailPending: false,
    },
  });
  const { errors, dirtyFields, isValidating } = accountForm.formState;

  const [phaseNumber, setPhaseNumber] = useState<number>(Phase.FIRST_NAME_AND_LAST_NAME);

  const [phrases, setPhrases] = useState<number[]>([0]);

  const [phrasesSetSubsidiary, setPhrasesSetSubsidiary] = useState<number[]>([
    0,
  ]);

  const [phrasesSetBase, setPhrasesSetBase] = useState<number[]>([0]);
  const [phrasesSetOnlineFlying, setPhrasesSetOnlineFlying] = useState<number[]>([0]);

  // States Phase 1
  const [logo, setLogo] = useState(false);

  // Remove unused addPhrase and fix setPhrases type usage
  const [loading, setLoading] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] =
    useState<Subsidiary | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { setUserAndToken } = useAuth();

  const password = accountForm.watch('password');
  const email = accountForm.watch('email');
  const firstName = accountForm.watch('firstName');
  const lastName = accountForm.watch('lastName');
  const subsidiaryId = accountForm.watch('subsidiaryId');

  // Fetch subsidiaries on component mount
  useEffect(() => {
    const fetchSubsidiaries = async () => {
      try {
        const response = await api.get('/subsidiaries/with-bases');
        setSubsidiaries(response.data);

        const initialSubsidiary = response.data.find(
          (s: Subsidiary) => s.id === 1
        );
        setSelectedSubsidiary(initialSubsidiary || response.data[0]);
      } catch (error) {
        console.error('Error fetching subsidiaries:', error);
      }
    };

    fetchSubsidiaries();
  }, []);

  // Update selected subsidiary when subsidiaryId changes
  useEffect(() => {
    const subsidiary = subsidiaries.find((s) => s.id === subsidiaryId);
    setSelectedSubsidiary(subsidiary || null);

    if (subsidiary && !subsidiary.bases.find((b) => b.id === accountForm.getValues('baseId'))) {
      accountForm.setValue('baseId', subsidiary.bases[0]?.id || 1);
    }
  }, [subsidiaryId, subsidiaries, accountForm]);

  const onSubmit: SubmitHandler<CreateAccountForm> = async (data) => {
    try {
      setLoading(true);
      const response = await createUser({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        username: data.userName,
        baseId: data.baseId,
        subsidiaryId: data.subsidiaryId,
      });

      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      setRegistrationComplete(true);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    console.log('prevPhaseNumber + 1');
    setPhaseNumber((prevPhaseNumber) => prevPhaseNumber + 1);
  };

  const handleBack = () => {
    setPhaseNumber((prevPhaseNumber) => prevPhaseNumber - 1);
  };

  const canProceedToNext = () => {
    if (phaseNumber === Phase.FIRST_NAME_AND_LAST_NAME) {
      const first = accountForm.getFieldState('firstName');
      const last  = accountForm.getFieldState('lastName');
  
      const okFirst = first.isDirty && !first.error;
      const okLast  = last.isDirty  && !last.error;
  
      return okFirst && okLast;
    }
  

    if (phaseNumber === Phase.EMAIL_AND_USERNAME) {
      const okUser = !!dirtyFields.userName && !errors.userName;
      const okMail = !!dirtyFields.email    && !errors.email;
      return okUser && okMail && !isValidating; // trava durante o debounce
    }

    if (phaseNumber === Phase.PASSWORD) {
      const okPassword = !!dirtyFields.password && !errors.password;
      const okConfirmPassword = !!dirtyFields.confirmPassword && !errors.confirmPassword;
      return okPassword && okConfirmPassword;
    }
  
    return true;
  };

  if (registrationComplete && phaseNumber === 6) {
    return (
      <div className="flex w-full h-screen bg-indigo-900">
        <div className="w-full max-w-screen-md flex items-center justify-center h-full">
          {renderStepContent()}
        </div>
        <div
          className="relative w-full bg-cover bg-left"
          style={{
            backgroundImage:
              "url('https://i2.wp.com/pilotstories.net/wp-content/uploads/2018/01/cockpit2-3-01.jpeg?fit=1920%2C1280&ssl=1')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/100 via-indigo-900/80 to-indigo-900/60"></div>
        </div>
      </div>
    );
  }

  const WelcomeToLatamVirtual = () => {
    return (
      <div className="flex flex-col items-center justify-center">
        <Collapse in={logo}>
          <img
            alt="LATAM Virtual Logo"
            src="/latam-logo.svg"
            className="w-64 h-auto mb-4 mx-auto"
          />
        </Collapse>

        <span className="text-6xl">
          <Typewriter
            options={{
              delay: 70,
              cursor: '',
            }}
            onInit={(typewriter) => {
              typewriter
                .start()
                .typeString('Welcome to LATAM Virtual')
                .pauseFor(1000)
                .callFunction(() => {
                  setLogo(true);
                })
                .pauseFor(3000)
                .callFunction(() => {
                  setPhaseNumber(1);
                });
            }}
          />
        </span>
      </div>
    );
  };

  const NotAffiliatedithLATAMAirlines = () => {
    return (
      <span className="text-2xl">
        <Typewriter
          options={{
            delay: 20,
            cursor: '',
          }}
          onInit={(typewriter) => {
            typewriter
              .typeString(
                'LATAM Virtual is a flight simulation environment and is not affiliated with LATAM Airlines in any way.'
              )
              .pauseFor(3000)
              .callFunction(() => {
                setPhaseNumber(2);
              })
              .start();
          }}
        />
      </span>
    );
  };

  const IsllAboutLearning = () => {
    return (
      <span className="text-2xl">
        {phrases.includes(0) && (
          <Typewriter
            options={{
              delay: 20,
              cursor: '',
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString('LATAM Virtual is all about ')
                .pauseFor(500)
                .changeDelay(30)
                .typeString('learning ')
                .pauseFor(500)
                .changeDelay(50)
                .typeString('and ')
                .pauseFor(500)
                .changeDelay(30)
                .typeString('growth.')
                .pauseFor(2500)
                .callFunction(() => setPhrases((prev) => [...prev, 1]))
                .start();
            }}
          />
        )}
      </span>
    );
  };

  const WeAimTo = () => {
    return (
      <span className="text-2xl">
        {phrases.includes(1) && (
          <Typewriter
            options={{
              delay: 20,
              cursor: '',
            }}
            onInit={(typewriter) => {
              typewriter
                .typeString(
                  'We aim to replicate the professionalism of real-world aviation, offering you a place to train, simulate authentic operations.'
                )
                .pauseFor(2500)
                .callFunction(() => setPhrases((prev) => [...prev, 2]))
                .start();
            }}
          />
        )}
      </span>
    );
  };

  const ReadyToJoinOurCrew = () => {
    return (
      <span className="text-2xl">
        {phrases.includes(2) && (
          <Typewriter
            options={{ delay: 20, cursor: '' }}
            onInit={(typewriter) => {
              typewriter
                .typeString('Ready to join our crew?')
                .pauseFor(1000)
                .callFunction(() => setPhrases((prev) => [...prev, 3]))
                .start();
            }}
          />
        )}
      </span>
    );
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('handleFormSubmit');
    handleNext();
  };

  return (
    <form
      onSubmit={(e) => handleFormSubmit(e)}
      className="flex flex-col justify-center items-center w-full h-screen bg-indigo-900 text-center"
    >
      <Box className="w-full max-w-4xl">
        <Collapse in={phaseNumber === 0}>
          {phaseNumber === 0 && WelcomeToLatamVirtual()}
        </Collapse>

        <Collapse in={phaseNumber === 1}>
          {phaseNumber === 1 && NotAffiliatedithLATAMAirlines()}
        </Collapse>

        <Collapse in={phaseNumber === 2}>
          <List>
            <TransitionGroup>
              {phaseNumber === 2 &&
                phrases.map((_, index) => (
                  <Collapse key={index} className="m-4">
                    {index === 0 && IsllAboutLearning()}
                    {index === 1 && WeAimTo()}
                    {index === 2 && ReadyToJoinOurCrew()}
                    {index === 3 && phrases.includes(3) && (
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setPhaseNumber(3)}
                      >
                        Yes, I'm ready to join!
                      </Button>
                    )}
                  </Collapse>
                ))}
            </TransitionGroup>
          </List>
        </Collapse>

        {/* Basic Info */}
        <PhaseWrapper phaseNumber={Phase.FIRST_NAME_AND_LAST_NAME} actualPhaseNumber={phaseNumber}>
          <FirstNameAndLastName accountForm={accountForm} />
        </PhaseWrapper>

        {/* Email and Username */}
        <PhaseWrapper phaseNumber={Phase.EMAIL_AND_USERNAME} actualPhaseNumber={phaseNumber}>
          <EmailAndUsername accountForm={accountForm} />
        </PhaseWrapper>

        {/* 5. Password */}
        <PhaseWrapper phaseNumber={Phase.PASSWORD} actualPhaseNumber={phaseNumber}>
          <Password accountForm={accountForm} />
        </PhaseWrapper>
        {/* <Collapse
          in={phaseNumber === 5}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 5 && (
            <div className="flex flex-col gap-6 text-center w-full">
              <span className="text-2xl">
                <Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString('Now, let’s add your password!')
                      .pauseFor(500)
                      .callFunction(() => setShouwThirdPhaseInput(true))
                      .start();
                  }}
                />
              </span>

              <div>
                <Collapse in={shouwThirdPhaseInput}>
                  {shouwThirdPhaseInput && (
                    <Controller
                      control={accountForm.control}
                      name="password"
                      rules={{ required: 'Password is required' }}
                      render={({ field }) => (
                        <PasswordInput
                          errors={accountForm.formState.errors}
                          field={field}
                          size="small"
                          className="mt-4 w-full"
                        />
                      )}
                    />
                  )}
                </Collapse>

                <Collapse in={shouwThirdPhaseInput}>
                  {shouwThirdPhaseInput && (
                    <>
                      <Controller
                        control={accountForm.control}
                        name="confirmPassword"
                        rules={{
                          required: 'Confirm Password is required',
                          validate: (value) =>
                            value === watch('password') ||
                            'Passwords do not match',
                        }}
                        render={({ field }) => (
                          <PasswordInput
                            errors={accountForm.formState.errors}
                            field={field}
                            label="Confirm Password"
                            size="small"
                            className="mt-4 w-full"
                          />
                        )}
                      />
                    </>
                  )}
                </Collapse>
              </div>
            </div>
          )}
        </Collapse> */}

        {/* 6. LATAM Group */}
        <PhaseWrapper phaseNumber={Phase.SUBSIDIARY} actualPhaseNumber={phaseNumber}>
          <LatamGroup accountForm={accountForm} subsidiaries={subsidiaries} />
        </PhaseWrapper>
        {/* <Collapse
          in={phaseNumber === 6}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 6 && (
            <div>
              <List>
                <TransitionGroup>
                  {phaseNumber === 6 &&
                    phrasesSetSubsidiary.map((_, index) => (
                      <Collapse key={index} className="m-4">
                        {index === 0 && phrasesSetSubsidiary.includes(0) && (
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
                                  setPhrasesSetSubsidiary((prev) => [
                                    ...prev,
                                    1,
                                  ])
                                );
                            }}
                          />
                        )}
                        {index === 1 && phrasesSetSubsidiary.includes(1) && (
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
                                  setPhrasesSetSubsidiary((prev) => [
                                    ...prev,
                                    2,
                                  ])
                                );
                            }}
                          />
                        )}
                        {index === 2 && phrasesSetSubsidiary.includes(2) && (
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
                                  setPhrasesSetSubsidiary((prev) => [
                                    ...prev,
                                    3,
                                  ])
                                );
                            }}
                          />
                        )}
                        {index === 3 &&
                          phrasesSetSubsidiary.includes(3) &&
                          phrasesSetSubsidiary.includes(3) && (
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
                                    setPhrasesSetSubsidiary((prev) => [
                                      ...prev,
                                      4,
                                    ])
                                  );
                              }}
                            />
                          )}
                        {index === 4 && phrasesSetSubsidiary.includes(4) && (
                          <Controller
                            control={accountForm.control}
                            name="subsidiaryId"
                            rules={{ required: 'Subsidiary is required' }}
                            render={({ field }) => (
                              <FormControl size="small" fullWidth>
                                <InputLabel>
                                  Select Your LATAM Subsidiary
                                </InputLabel>
                                <Select
                                  {...field}
                                  label="Select Your LATAM Subsidiary"
                                  error={!!accountForm.formState.errors[field.name]}
                                >
                                  {subsidiaries.map((subsidiary) => (
                                    <MenuItem
                                      key={subsidiary.id}
                                      value={subsidiary.id}
                                    >
                                      <Box>
                                        <Typography variant="body1">
                                          {subsidiary.name}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {subsidiary.icaoCode} -{' '}
                                          {subsidiary.bases.length} bases
                                          available
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
          )}
        </Collapse> */}

        {/* 7. Base */}
        <Collapse
          in={phaseNumber === 7}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 7 && (
            <div>
              <List>
                <TransitionGroup>
                  {phaseNumber === 7 &&
                    phrasesSetBase.map((_, index) => (
                      <Collapse key={index} className="m-4">
                        {index === 0 && phrasesSetBase.includes(0) && (
                          <Typewriter
                            options={{ delay: 20, cursor: '' }}
                            onInit={(typewriter) => {
                              typewriter
                                .typeString(
                                  'Every pilot needs a base of operations.'
                                )
                                .start()
                                .pauseFor(500)
                                .callFunction(() =>
                                  setPhrasesSetBase((prev) => [...prev, 1])
                                );
                            }}
                          />
                        )}
                        {index === 1 && phrasesSetBase.includes(1) && (
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
                        )}
                        {index === 2 && phrasesSetBase.includes(2) && (
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
                                >
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
                                          {base.baseAirports.map(
                                            (baseAirport, index) => (
                                              <span key={baseAirport.id}>
                                                {baseAirport.airportCode}{' '}
                                                {base.baseAirports.length > 1 &&
                                                index !==
                                                  base.baseAirports.length - 1
                                                  ? ', '
                                                  : ''}
                                              </span>
                                            )
                                          )}
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
          )}
        </Collapse>

        {/* 8. Online Flying */}
        <Collapse
          in={phaseNumber === 8}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 8 && (
            <div>
              <List>
                <TransitionGroup>
                  {phaseNumber === 8 &&
                    phrasesSetOnlineFlying.map((_, index) => (
                      <Collapse key={index} className="m-4">
                        {index === 0 && phrasesSetOnlineFlying.includes(0) && (
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
                        )}
                        {index === 1 && phrasesSetOnlineFlying.includes(1) && (
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
                        )}
                        {index === 2 && phrasesSetOnlineFlying.includes(2) && (
                          <>
                            <Controller
                              control={accountForm.control}
                              name="ivaoId"
                              rules={{ required: 'IVAO ID is required' }}
                              render={({ field }) => (
                                <TextField
                                  label="IVAO ID"
                                  {...field}
                                  error={!!accountForm.formState.errors[field.name]}
                                  helperText={
                                    accountForm.formState.errors[field.name]?.message as string || ' '
                                  }
                                  size="small"
                                  fullWidth
                                />
                              )}
                            />

                            <Controller
                              control={accountForm.control}
                              name="vatsimId"
                              rules={{ required: 'VATSIM ID is required' }}
                              render={({ field }) => (
                                <TextField
                                  label="VATSIM ID"
                                  {...field}
                                  error={!!accountForm.formState.errors[field.name]}
                                  helperText={
                                    accountForm.formState.errors[field.name]?.message as string || ' '
                                  }
                                  size="small"
                                  fullWidth
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
          )}
        </Collapse>

        {/* <Box className="text-center mb-6">
          <img
            alt="LATAM Virtual Logo"
            src="/latam-logo.svg"
            className="w-32 h-auto mb-4 mx-auto"
          />
          <Typography variant="h6" color="white" gutterBottom>
            LATAM Virtual - Pilot Registration
          </Typography>
        </Box> */}

        {/* Stepper */}
        {/* <Stepper activeStep={activeStep} alternativeLabel className="mb-6">
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel icon={step.icon}>
                  <Typography variant="caption" color="white">
                    {step.label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper> */}

        {/* Step Content */}
        {/* <Box className="flex justify-center">{renderStepContent()}</Box> */}

        {/* Navigation Buttons */}
        {phaseNumber > 2 && (
          <Box className="flex justify-between mt-6">
            <Button
              disabled={phaseNumber === 0}
              onClick={handleBack}
              variant="outlined"
              color="inherit"
              sx={{ color: 'white', borderColor: 'white' }}
            >
              Back
            </Button>

            {phaseNumber === 200 ? (
              <LoadingButton
                onClick={handleSubmit(onSubmit)}
                loading={loading}
                variant="contained"
                color="secondary"
                endIcon={<SendIcon />}
                disabled={!canProceedToNext()}
              >
                Create Account
              </LoadingButton>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            )}
          </Box>
        )}

        {/* Login Link */}
        {/* {activeStep === 0 && (
          <Box className="text-center mt-6">
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <Typography
                variant="body2"
                color="white"
                sx={{ '&:hover': { textDecoration: 'underline' } }}
              >
                Already have an account? Click here to login
              </Typography>
            </Link>
          </Box>
        )} */}
      </Box>
    </form>
  );
};