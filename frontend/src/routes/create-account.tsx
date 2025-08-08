import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import {
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  IconButton,
  Collapse,
  ListItemText,
  ListItem,
} from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import PasswordInput from '../components/forms/passwordInput.tsx';
import SendIcon from '@mui/icons-material/Send';
import LoadingButton from '@mui/lab/LoadingButton';
import { useState, useEffect, memo, useCallback } from 'react';
import { createUser } from '../services/auth.service.ts';
import { useDebouncedCallback } from 'use-debounce';
import { checkIfUsernameExistsByUsernameOrEmail } from '../services/latam/latam.service.ts';
import { useAuth } from '../context/auth.context.tsx';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import api from '../services/api';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { TransitionGroup } from 'react-transition-group';
import DeleteIcon from '@mui/icons-material/Delete';
import Typewriter from 'typewriter-effect';

interface CreateAccountForm {
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
}

interface Subsidiary {
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
    setValue,
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
      baseId: 1,
      subsidiaryId: 1,
      acceptTerms: false,
    },
  });

  const [phaseNumber, setPhaseNumber] = useState<number>(5);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [logo, setLogo] = useState(false);

  const [phrases, setPhrases] = useState<number[]>([0]);
  const [shouwFirstPhaseInput, setShouwFirstPhaseInput] = useState(false);
  const [shouwSecondPhaseInput, setShouwSecondPhaseInput] = useState(false);
  const [shouwThirdPhaseInput, setShouwThirdPhaseInput] = useState(false);
  const [shouwFourthPhaseInput, setShouwFourthPhaseInput] = useState(false);
  const [shouwFifthPhaseInput, setShouwFifthPhaseInput] = useState(false);
  const [shouwSixthPhaseInput, setShouwSixthPhaseInput] = useState(false);

  const addPhrase = () => {
    console.log('Vai adicionar frase', phrases);
    setPhrases((prev) => [...prev, '']);
  };

  const [loading, setLoading] = useState(false);
  const [loadingValidationName, setValidationName] = useState(false);
  const [loadingValidationEmail, setValidationEmail] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] =
    useState<Subsidiary | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { setUserAndToken } = useAuth();
  const route = useRouter();

  const password = watch('password');
  const ivaoId = watch('ivaoId');
  const vatsimId = watch('vatsimId');
  const username = watch('userName');
  const email = watch('email');
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const subsidiaryId = watch('subsidiaryId');
  const acceptTerms = watch('acceptTerms');

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

    if (subsidiary && !subsidiary.bases.find((b) => b.id === watch('baseId'))) {
      setValue('baseId', subsidiary.bases[0]?.id || 1);
    }
  }, [subsidiaryId, subsidiaries, setValue, watch]);

  const spaceNorAllowed = {
    value: /^\S*$/,
    message: 'Spaces are not allowed',
  };

  const onlyNumbers = {
    value: /^[0-9]+$/,
    message: 'Only numbers are allowed',
  };

  const ivaoOrVatsimValidation = () => {
    if (!ivaoId && !vatsimId) {
      setError('ivaoId', {
        message: 'You need to be registered with VATSIM or IVAO',
      });
      setError('vatsimId', {
        message: 'You need to be registered with VATSIM or IVAO',
      });
      return 'You need to be registered with VATSIM or IVAO';
    } else {
      clearErrors('ivaoId');
      clearErrors('vatsimId');
      return true;
    }
  };

  const debounceValidateEmail = useDebouncedCallback(async () => {
    if (errors.email && errors.email.type !== 'manual') {
      return;
    }

    try {
      setValidationEmail(true);
      const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(email))
        .data;
      if (!isValid) {
        setError('email', {
          type: 'manual',
          message:
            'This email is already associated with an account. Please use a different email.',
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
      return;
    }

    try {
      setValidationName(true);
      const isValid = !(await checkIfUsernameExistsByUsernameOrEmail(username))
        .data;
      if (!isValid) {
        setError('userName', {
          type: 'manual',
          message: 'This username is already in use. Try another one.',
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
        baseId: data.baseId,
        subsidiaryId: data.subsidiaryId,
      });

      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      setRegistrationComplete(true);
      setActiveStep(6); // Go to completion step
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
    switch (phaseNumber) {
      case 0: // Welcome - always can proceed
        return true;
      case 3: // Basic Info
        return !!(
          firstName &&
          lastName &&
          !errors.firstName &&
          !errors.lastName
        );
      case 4: // Email and Username
        return !!(email && username && !errors.email && !errors.userName);
      case 5: // Password
        return !!(password && !errors.password);
      case 2: // LATAM Group
        return !!subsidiaryId;
      // case 3: // Your Base
      //   return !!watch('baseId');
      // case 4: // Online Flying
      //   return !!(ivaoId || vatsimId) && !errors.ivaoId && !errors.vatsimId;
      case 6: // Review
        return acceptTerms;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="text-center p-8">
              <FlightTakeoffIcon
                sx={{ fontSize: 80, color: 'primary.main', mb: 3 }}
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to LATAM Virtual
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your Journey to Professional Virtual Aviation Begins Here
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body1" paragraph>
                LATAM Virtual is a professional virtual airline that simulates
                real-world operations of LATAM Airlines Group. As a virtual
                pilot, you'll experience the thrill of flying real routes,
                following real procedures, and being part of a professional
                aviation community.
              </Typography>
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>What you'll experience:</strong>
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Real flight routes and schedules</li>
                  <li>Professional flight planning and operations</li>
                  <li>Online flying with VATSIM/IVAO networks</li>
                  <li>Career progression and achievements</li>
                  <li>Community of aviation enthusiasts</li>
                </ul>
              </Alert>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <Typography variant="h5" gutterBottom>
                Tell Us About Yourself
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Let's start with your basic information. This will be used to
                create your pilot profile.
              </Typography>

              <TextField
                label="Email"
                {...register('email', {
                  required: 'Email is required',
                  onChange: debounceValidateEmail,
                  pattern: {
                    value: EMAIL_REGEX,
                    message: 'Invalid email format',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message || ' '}
                size="small"
                fullWidth
                className="mt-4"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CircularProgress
                        size={16}
                        className={loadingValidationEmail ? '' : 'hidden'}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Username"
                {...register('userName', {
                  required: 'Username is required',
                  pattern: spaceNorAllowed,
                  onChange: debounceValidateUsername,
                })}
                error={!!errors.userName}
                helperText={errors.userName?.message || ' '}
                size="small"
                fullWidth
                className="mt-4"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CircularProgress
                        size={16}
                        className={loadingValidationName ? '' : 'hidden'}
                      />
                    </InputAdornment>
                  ),
                }}
              />

              <Controller
                control={control}
                name="password"
                rules={{ required: 'Password is required' }}
                render={({ field }) => (
                  <PasswordInput
                    errors={errors}
                    field={field}
                    size="small"
                    className="mt-4"
                  />
                )}
              />
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <Typography variant="h5" gutterBottom>
                Choose Your LATAM Group
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                LATAM Airlines Group operates across multiple countries and
                regions. Each subsidiary offers different routes and flight
                opportunities. Don't worry - you can change your subsidiary
                later if you want to explore different regions!
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>What this means:</strong> You'll have access to
                  flights operated by your chosen subsidiary. This includes
                  domestic and international routes specific to that region.
                </Typography>
              </Alert>

              <Controller
                control={control}
                name="subsidiaryId"
                rules={{ required: 'Subsidiary is required' }}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select Your LATAM Subsidiary</InputLabel>
                    <Select
                      {...field}
                      label="Select Your LATAM Subsidiary"
                      error={!!errors[field.name]}
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
                              {subsidiary.icaoCode} - {subsidiary.bases.length}{' '}
                              bases available
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <Typography variant="h5" gutterBottom>
                Select Your Home Base
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                In real aviation, pilots operate from specific bases and fly
                Flight Duties - sequences of flights that start and end at their
                home base. This creates realistic operational patterns.
              </Typography>

              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Flight Duty:</strong> A series of flights that begin
                  and end at your base. This simulates real pilot scheduling and
                  creates more immersive flying experiences.
                </Typography>
              </Alert>

              <Controller
                control={control}
                name="baseId"
                rules={{ required: 'Base is required' }}
                render={({ field }) => (
                  <FormControl size="small" fullWidth>
                    <InputLabel>Select Your Home Base</InputLabel>
                    <Select
                      {...field}
                      label="Select Your Home Base"
                      error={!!errors[field.name]}
                      disabled={!selectedSubsidiary}
                    >
                      {selectedSubsidiary?.bases.map((base) => (
                        <MenuItem key={base.id} value={base.id}>
                          <Box>
                            <Typography variant="body1">{base.name}</Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {base.city}, {base.state}
                              {base.baseAirports.length > 0 && (
                                <span className="ml-2">
                                  (
                                  {base.baseAirports
                                    .map((ba) => ba.airportCode)
                                    .join(', ')}
                                  )
                                </span>
                              )}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <Typography variant="h5" gutterBottom>
                Online Flying Networks
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Flying online with VATSIM or IVAO networks makes your experience
                much more professional and enjoyable. You'll interact with real
                air traffic control, other pilots, and follow real aviation
                procedures.
              </Typography>

              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Important:</strong> All flights on LATAM Virtual must
                  be flown online. This ensures a professional and realistic
                  experience for everyone.
                </Typography>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="ivaoId"
                  rules={{
                    validate: ivaoOrVatsimValidation,
                    pattern: onlyNumbers,
                  }}
                  render={({ field }) => (
                    <TextField
                      label="IVAO ID (Optional)"
                      {...field}
                      error={!!errors[field.name]}
                      helperText={
                        errors[field.name]?.message ||
                        'Enter your IVAO ID if you have one'
                      }
                      size="small"
                      fullWidth
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="vatsimId"
                  rules={{
                    validate: ivaoOrVatsimValidation,
                    pattern: onlyNumbers,
                  }}
                  render={({ field }) => (
                    <TextField
                      label="VATSIM ID (Optional)"
                      {...field}
                      error={!!errors[field.name]}
                      helperText={
                        errors[field.name]?.message ||
                        'Enter your VATSIM ID if you have one'
                      }
                      size="small"
                      fullWidth
                    />
                  )}
                />
              </div>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Don't have an ID yet?</strong> You can register for
                  free at{' '}
                  <a
                    href="https://www.vatsim.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    VATSIM.net
                  </a>{' '}
                  or{' '}
                  <a
                    href="https://www.ivao.aero"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit' }}
                  >
                    IVAO.aero
                  </a>
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="p-6">
              <Typography variant="h5" gutterBottom>
                Review Your Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please review all your information before creating your account.
                Make sure everything is correct.
              </Typography>

              <Box className="space-y-4">
                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Personal Information
                  </Typography>
                  <Typography variant="body2">
                    Name: {firstName} {lastName}
                  </Typography>
                  <Typography variant="body2">Email: {email}</Typography>
                  <Typography variant="body2">Username: {username}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary">
                    LATAM Assignment
                  </Typography>
                  <Typography variant="body2">
                    Subsidiary:{' '}
                    {subsidiaries.find((s) => s.id === subsidiaryId)?.name}
                  </Typography>
                  <Typography variant="body2">
                    Base:{' '}
                    {
                      selectedSubsidiary?.bases.find(
                        (b) => b.id === watch('baseId')
                      )?.name
                    }{' '}
                    -{' '}
                    {
                      selectedSubsidiary?.bases.find(
                        (b) => b.id === watch('baseId')
                      )?.city
                    }
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="primary">
                    Online Networks
                  </Typography>
                  <Typography variant="body2">
                    IVAO ID: {ivaoId || 'Not provided'}
                  </Typography>
                  <Typography variant="body2">
                    VATSIM ID: {vatsimId || 'Not provided'}
                  </Typography>
                </Box>
              </Box>

              <Controller
                control={control}
                name="acceptTerms"
                rules={{ required: 'You must accept the terms and conditions' }}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I accept the{' '}
                        <a href="#" style={{ color: 'inherit' }}>
                          Terms and Conditions
                        </a>{' '}
                        and{' '}
                        <a href="#" style={{ color: 'inherit' }}>
                          Privacy Policy
                        </a>{' '}
                        of LATAM Virtual
                      </Typography>
                    }
                    className="mt-4"
                  />
                )}
              />

              {errors.acceptTerms && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  sx={{ mt: 1 }}
                >
                  {errors.acceptTerms.message}
                </Typography>
              )}
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="text-center p-8">
              <CelebrationIcon
                sx={{ fontSize: 80, color: 'success.main', mb: 3 }}
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Welcome to LATAM Virtual!
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Your account has been created successfully
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body1" paragraph>
                You're now part of the LATAM Virtual family! Here's what you can
                do next:
              </Typography>

              <Box className="space-y-2 text-left">
                <Typography variant="body2">
                  • Complete your pilot profile and preferences
                </Typography>
                <Typography variant="body2">
                  • Browse available flights and schedules
                </Typography>
                <Typography variant="body2">
                  • Join our community forums and Discord
                </Typography>
                <Typography variant="body2">
                  • Start your first flight duty
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={() => route.navigate({ to: '/' })}
                sx={{ mt: 4 }}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
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
                .pauseFor(500).changeDelay(30)
                .typeString('learning ')
                .pauseFor(500).changeDelay(50)
                .typeString('and ')
                .pauseFor(500).changeDelay(30)
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

  const handleFormSubmit = () => {
    console.log('handleFormSubmit');
  };

  return (
    <form onSubmit={() => handleFormSubmit()} className="flex flex-col justify-center items-center w-full h-screen bg-indigo-900 text-center">
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
                    {index === 3 && (
                      phrases.includes(3) && <Button
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
        <Collapse
          in={phaseNumber === 3}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 3 && (
            <div className="flex flex-col gap-6 text-center">
              <span className="text-2xl">
                <Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString('Let’s start with the basics.')
                      .pauseFor(500)
                      .callFunction(() => setShouwFirstPhaseInput(true))
                      .start();
                  }}
                />
              </span>

              <div>
                <Collapse in={shouwFirstPhaseInput}>
                  {shouwFirstPhaseInput && (
                    <>
                      <Controller
                        control={control}
                        name="firstName"
                        rules={{ required: 'First name is required' }}
                        render={({ field }) => (
                          <TextField
                            label="First Name"
                            {...field}
                            error={!!errors[field.name]}
                            helperText={errors[field.name]?.message || ' '}
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </>
                  )}
                </Collapse>

                <Collapse in={shouwFirstPhaseInput}>
                  {shouwFirstPhaseInput && (
                    <Controller
                      control={control}
                      name="lastName"
                      rules={{ required: 'First name is required' }}
                      render={({ field }) => (
                        <TextField
                          label="Last Name"
                          {...field}
                          error={!!errors[field.name]}
                          helperText={errors[field.name]?.message || ' '}
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  )}
                </Collapse>
              </div>
            </div>
          )}
        </Collapse>

        {/* Email and Username */}
        <Collapse
          in={phaseNumber === 4}
          easing={{ enter: 'ease-in-out', exit: 'ease-in-out' }}
        >
          {phaseNumber === 4 && (
            <div className="flex flex-col gap-6 text-center">
              <span className="text-2xl">
                <Typewriter
                  options={{ delay: 20, cursor: '' }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString('Now, let’s add your email and username.')
                      .pauseFor(500)
                      .callFunction(() => setShouwSecondPhaseInput(true))
                      .start();
                  }}
                />
              </span>

              <div>
                <Collapse in={shouwSecondPhaseInput}>
                  {shouwSecondPhaseInput && (
                    <Controller
                      control={control}
                      name="userName"
                      rules={{ required: 'Username is required' }}
                      render={({ field }) => (
                        <TextField
                          label="Username"
                          {...field}
                          error={!!errors[field.name]}
                          helperText={errors[field.name]?.message || ' '}
                          size="small"
                          fullWidth
                        />
                      )}
                    />
                  )}
                </Collapse>

                <Collapse in={shouwSecondPhaseInput}>
                  {shouwSecondPhaseInput && (
                    <>
                      <Controller
                        control={control}
                        name="email"
                        rules={{ required: 'Email is required' }}
                        render={({ field }) => (
                          <TextField
                            label="Email"
                            {...field}
                            error={!!errors[field.name]}
                            helperText={errors[field.name]?.message || ' '}
                            size="small"
                            fullWidth
                          />
                        )}
                      />
                    </>
                  )}
                </Collapse>
              </div>
            </div>
          )}
        </Collapse>

        {/* Password */}
        <Collapse
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
                      control={control}
                      name="password"
                      rules={{ required: 'Password is required' }}
                      render={({ field }) => (
                        <PasswordInput
                          errors={errors}
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
                        control={control}
                        name="confirmPassword"
                        rules={{
                          required: 'Confirm Password is required',
                          validate: (value) =>
                            value === watch('password') ||
                            'Passwords do not match',
                        }}
                        render={({ field }) => (
                          <PasswordInput
                            errors={errors}
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

            {phaseNumber === 5 ? (
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
                onClick={handleNext}
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

export const Route = createFileRoute('/create-account')({
  component: CreateAccount,
});
