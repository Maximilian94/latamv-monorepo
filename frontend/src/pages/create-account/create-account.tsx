import { Button, Box, List, Collapse } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import SendIcon from '@mui/icons-material/Send';
import LoadingButton from '@mui/lab/LoadingButton';
import { useState, useEffect } from 'react';
import { createUser } from '../../services/auth.service.ts';
import { useAuth } from '../../context/auth.context.tsx';
import api from '../../services/api.ts';
import { TransitionGroup } from 'react-transition-group';
import Typewriter from 'typewriter-effect';
import { FirstNameAndLastName } from './first-name-and-last-name.tsx';
import { EmailAndUsername } from './email-and-user-name.tsx';
import { PhaseWrapper } from './phase-wrapper.tsx';
import { Password } from './password.tsx';
import { LatamGroup } from './latam-group.tsx';
import { Base } from './base.tsx';
import { OnlineFlying } from './online-flying.tsx';
import { Review } from './review.tsx';
import { RegistrationComplete } from './registration-complete.tsx';
import { useNavigate } from '@tanstack/react-router';

enum Phase {
  FIRST_NAME_AND_LAST_NAME = 3,
  EMAIL_AND_USERNAME = 4,
  PASSWORD = 5,
  SUBSIDIARY = 6,
  BASE = 7,
  ONLINE_FLYING = 8,
  REVIEW = 9,
  REGISTRATION_COMPLETE = 10,
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
  baseId: number | null;
  subsidiaryId: number | null;
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

export interface Base {
  id: number;
  name: string;
  city: string;
  state: string;
  baseAirports: BaseAirport[];
}

export interface BaseAirport {
  id: number;
  airportCode: string;
}

export const CreateAccountPage: React.FC = () => {
  const navigate = useNavigate();
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
      baseId: null,
      subsidiaryId: null,
      acceptTerms: false,
      __emailPending: false,
    },
  });
  const { errors, dirtyFields, isValidating } = accountForm.formState;

  const [phaseNumber, setPhaseNumber] = useState<number>(
    0
  );

  const [phrases, setPhrases] = useState<number[]>([0]);

  // States Phase 1
  const [logo, setLogo] = useState(false);

  // Remove unused addPhrase and fix setPhrases type usage
  const [loading, setLoading] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] =
    useState<Subsidiary | null>(null);
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

        // Remova a pré-seleção:
        // const initialSubsidiary = response.data.find((s: Subsidiary) => s.id === 1);
        // setSelectedSubsidiary(initialSubsidiary || response.data[0]);
        setSelectedSubsidiary(null); // deixa vazio até o usuário escolher
      } catch (error) {
        console.error('Error fetching subsidiaries:', error);
      }
    };
    fetchSubsidiaries();
  }, []);

  // Update selected subsidiary when subsidiaryId changes
  useEffect(() => {
    if (subsidiaryId == null) {
      setSelectedSubsidiary(null);
      accountForm.setValue('baseId', null, {
        shouldDirty: false,
        shouldTouch: false,
      });
      return;
    }

    const subsidiary = subsidiaries.find((s) => s.id === subsidiaryId) || null;
    setSelectedSubsidiary(subsidiary);

    // sempre que trocar a subsidiária, limpe a base:
    accountForm.setValue('baseId', null, {
      shouldDirty: false,
      shouldTouch: false,
    });
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
        baseId: data.baseId as number,
        subsidiaryId: data.subsidiaryId as number,
      });

      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      setPhaseNumber(Phase.REGISTRATION_COMPLETE);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setPhaseNumber((prevPhaseNumber) => prevPhaseNumber + 1);
  };

  const handleBack = () => {
    setPhaseNumber((prevPhaseNumber) => prevPhaseNumber - 1);
  };

  const canProceedToNext = () => {
    if (phaseNumber === Phase.FIRST_NAME_AND_LAST_NAME) {
      const first = accountForm.getFieldState('firstName');
      const last = accountForm.getFieldState('lastName');

      const okFirst = first.isDirty && !first.error;
      const okLast = last.isDirty && !last.error;

      return okFirst && okLast;
    }

    if (phaseNumber === Phase.EMAIL_AND_USERNAME) {
      const okUser = !!dirtyFields.userName && !errors.userName;
      const okMail = !!dirtyFields.email && !errors.email;
      return okUser && okMail && !isValidating; // trava durante o debounce
    }

    if (phaseNumber === Phase.PASSWORD) {
      const okPassword = !!dirtyFields.password && !errors.password;
      const okConfirmPassword =
        !!dirtyFields.confirmPassword && !errors.confirmPassword;
      return okPassword && okConfirmPassword;
    }

    if (phaseNumber === Phase.SUBSIDIARY) {
      const st = accountForm.getFieldState('subsidiaryId');
      return !!accountForm.watch('subsidiaryId') && st.isDirty && !st.error;
    }

    if (phaseNumber === Phase.BASE) {
      const st = accountForm.getFieldState('baseId');
      const hasValue = !!accountForm.watch('baseId');
      return hasValue && st.isDirty && !st.error;
    }

    if (phaseNumber === Phase.ONLINE_FLYING) {
      const { isValidating } = accountForm.formState;

      const ivao = (accountForm.getValues('ivaoId') ?? '').trim();
      const vatsim = (accountForm.getValues('vatsimId') ?? '').trim();

      const hasOne = ivao.length > 0 || vatsim.length > 0;

      const ivaoState = accountForm.getFieldState('ivaoId');
      const vatsimState = accountForm.getFieldState('vatsimId');

      const noErrors = !ivaoState.error && !vatsimState.error;

      return hasOne && noErrors && !isValidating;
    }

    if (phaseNumber === Phase.REVIEW) {
      return true; // Always allow proceeding from review
    }

    return true;
  };

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
    if (phaseNumber === Phase.REVIEW) {
      return onSubmit(accountForm.getValues());
    }

    if (canProceedToNext()) {
      handleNext();
    }
  };

  const navigateToPilotDashboard = () => {
    navigate({to: '/main'});
  }

  return (
    <form
      onSubmit={(e) => handleFormSubmit(e)}
      className="flex flex-col justify-center items-center w-full h-screen bg-indigo-900 text-center box-border"
    >
      <Box className="w-full flex flex-col justify-between max-w-screen-lg h-full box-border p-10">
        <div className="flex-1 w-full flex flex-col justify-center items-center">
          <div className="flex flex-col justify-center items-center w-full">
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
            <PhaseWrapper
              phaseNumber={Phase.FIRST_NAME_AND_LAST_NAME}
              actualPhaseNumber={phaseNumber}
            >
              <FirstNameAndLastName accountForm={accountForm} />
            </PhaseWrapper>

            {/* Email and Username */}
            <PhaseWrapper
              phaseNumber={Phase.EMAIL_AND_USERNAME}
              actualPhaseNumber={phaseNumber}
            >
              <EmailAndUsername accountForm={accountForm} />
            </PhaseWrapper>

            {/* 5. Password */}
            <PhaseWrapper
              phaseNumber={Phase.PASSWORD}
              actualPhaseNumber={phaseNumber}
            >
              <Password accountForm={accountForm} />
            </PhaseWrapper>

            {/* 6. LATAM Group */}
            <PhaseWrapper
              phaseNumber={Phase.SUBSIDIARY}
              actualPhaseNumber={phaseNumber}
            >
              <LatamGroup
                accountForm={accountForm}
                subsidiaries={subsidiaries}
              />
            </PhaseWrapper>

            {/* 7. Base */}
            <PhaseWrapper
              phaseNumber={Phase.BASE}
              actualPhaseNumber={phaseNumber}
            >
              <Base
                accountForm={accountForm}
                selectedSubsidiary={selectedSubsidiary || null}
              />
            </PhaseWrapper>

            {/* 8. Online Flying */}
            <PhaseWrapper
              phaseNumber={Phase.ONLINE_FLYING}
              actualPhaseNumber={phaseNumber}
            >
              <OnlineFlying accountForm={accountForm} />
            </PhaseWrapper>

            {/* 9. Review */}
            <PhaseWrapper
              phaseNumber={Phase.REVIEW}
              actualPhaseNumber={phaseNumber}
            >
              <Review
                accountForm={accountForm}
                subsidiaries={subsidiaries}
                selectedSubsidiary={selectedSubsidiary || null}
              />
            </PhaseWrapper>

            {/* 10. Registration Complete */}
            <PhaseWrapper
              phaseNumber={Phase.REGISTRATION_COMPLETE}
              actualPhaseNumber={phaseNumber}
            >
              <RegistrationComplete navigateToPilotDashboard={navigateToPilotDashboard} />
            </PhaseWrapper>
          </div>
        </div>

        <div className='h-10 w-full flex justify-between items-center'>
          <div className='w-1/2 flex justify-start'>
            {phaseNumber > 2 && (
          <Button
                disabled={phaseNumber === 0}
                onClick={handleBack}
                variant="outlined"
                color="inherit"
                sx={{ color: 'white', borderColor: 'white' }}
              >
                Back
              </Button>
            )}
          </div>

          <div className='w-1/2 flex justify-end'>
            {phaseNumber > 2 && phaseNumber < Phase.REVIEW && (
              <Button
              type="submit"
              variant="contained"
              color="secondary"
              disabled={!canProceedToNext()}
            >
              Next
            </Button>
            )}

            {phaseNumber === Phase.REVIEW && (
              <LoadingButton
                  type="submit"
                  loading={loading}
                  variant="contained"
                  color="secondary"
                  endIcon={<SendIcon />}
                  disabled={loading}
                >
                  Create Account
                </LoadingButton>
            )}
          </div>
        </div>
      </Box>
    </form>
  );
};
