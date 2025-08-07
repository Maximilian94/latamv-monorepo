import {
  Typography,
  Grid,
  Avatar,
  Divider,
  Box,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Card } from './card.tsx';
import { useAuth } from '../context/auth.context.tsx';
import PlanManager from './planManager.tsx';
import { convertMinutesTo_HH_MM } from '../utils/flight.ts';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useState, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import api from '../services/api';

interface Subsidiary {
  id: number;
  name: string;
  code: string;
  icaoCode: string;
  description?: string;
  country: string;
  bases: Base[];
}

interface Base {
  id: number;
  name: string;
  description?: string;
  city: string;
  state: string;
  country: string;
  subsidiaryId: number;
  baseAirports: BaseAirport[];
}

interface BaseAirport {
  id: number;
  baseId: number;
  airportCode: string;
}

interface SubsidiaryBaseForm {
  subsidiaryId: number;
  baseId: number;
}

export default function UserProfile() {
  const { user, setUserAndToken } = useAuth();
  
  const [isEditingSubsidiaryBase, setIsEditingSubsidiaryBase] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [hasOpenFlightDuty, setHasOpenFlightDuty] = useState(false);

  const {
    control,
    formState: { errors },
    watch,
    setValue,
    handleSubmit,
    reset,
  } = useForm<SubsidiaryBaseForm>({
    mode: 'onChange',
    defaultValues: {
      subsidiaryId: user?.subsidiaryId || 1,
      baseId: user?.baseId || 1,
    },
  });

  const subsidiaryId = watch('subsidiaryId');

  // Fetch subsidiaries and check flight duty status on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subsidiaries
        const subsidiariesResponse = await api.get('/subsidiaries/with-bases');
        setSubsidiaries(subsidiariesResponse.data);
        
        // Set initial selected subsidiary
        const currentSubsidiary = subsidiariesResponse.data.find((s: Subsidiary) => s.id === user?.subsidiaryId);
        setSelectedSubsidiary(currentSubsidiary || subsidiariesResponse.data[0]);

        // Check if user has open flight duty
        const flightDutyResponse = await api.get('/flight-duty/has-open');
        setHasOpenFlightDuty(flightDutyResponse.data.hasOpenFlightDuty);
      } catch (error) {
        console.error('Error fetching data:', error);
        setErrorMessage('Failed to load data');
      }
    };

    fetchData();
  }, [user?.subsidiaryId]);

  // Update selected subsidiary when subsidiaryId changes
  useEffect(() => {
    const subsidiary = subsidiaries.find(s => s.id === subsidiaryId);
    setSelectedSubsidiary(subsidiary || null);
    
    // Reset base selection if it's not available in the new subsidiary
    if (subsidiary && !subsidiary.bases.find(b => b.id === user?.baseId)) {
      setValue('baseId', subsidiary.bases[0]?.id || 1);
    }
  }, [subsidiaryId, subsidiaries, setValue, user?.baseId]);

  const handleEditSubsidiaryBase = () => {
    setIsEditingSubsidiaryBase(true);
    reset({
      subsidiaryId: user?.subsidiaryId || 1,
      baseId: user?.baseId || 1,
    });
  };

  const handleCancelEdit = () => {
    setIsEditingSubsidiaryBase(false);
    setSuccessMessage('');
    setErrorMessage('');
    reset({
      subsidiaryId: user?.subsidiaryId || 1,
      baseId: user?.baseId || 1,
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onSubmitSubsidiaryBase = async (data: SubsidiaryBaseForm) => {
    try {
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      const response = await api.put(`/user/${user?.id}/subsidiary-base`, {
        subsidiaryId: data.subsidiaryId,
        baseId: data.baseId,
      });

      // Update user context with new data
      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      setSuccessMessage('Subsidiary and base updated successfully!');
      setIsEditingSubsidiaryBase(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error updating subsidiary and base:', error);
      let errorMessage = 'Failed to update subsidiary and base. Please try again.';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      }
      setErrorMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Typography variant="h6">Loading user data...</Typography>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Typography variant="h4" component="h1" gutterBottom>
        Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* User Information Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <div className="flex items-center gap-4 mb-4">
              <Avatar
                sx={{ width: 80, height: 80 }}
                src="https://cdn-icons-png.flaticon.com/512/9159/9159709.png"
              />
              <div>
                <Typography variant="h5" component="h2">
                  {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.roles?.map(role => role.name).join(', ') || 'Pilot'}
                </Typography>
              </div>
            </div>
            
            <Divider sx={{ my: 2 }} />
            
            <Box className="space-y-3">
              <div className="flex items-center gap-2">
                <PersonIcon color="action" />
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Username
                  </Typography>
                  <Typography variant="body1">
                    {user.username}
                  </Typography>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <EmailIcon color="action" />
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {user.email}
                  </Typography>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <QueryBuilderIcon color="action" />
                <div>
                  <Typography variant="body2" color="text.secondary">
                    Flight Hours
                  </Typography>
                  <Typography variant="body1">
                    {convertMinutesTo_HH_MM(user.flightHours || 0)}
                  </Typography>
                </div>
              </div>
            </Box>
          </Card>
        </Grid>

        {/* Subsidiary and Base Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" component="h3" gutterBottom>
              Subsidiary & Base
            </Typography>

            {hasOpenFlightDuty && (
              <Alert severity="warning" className="mb-4">
                Cannot edit subsidiary and base while you have an open flight duty
              </Alert>
            )}

            {successMessage && (
              <Alert severity="success" className="mb-4">
                {successMessage}
              </Alert>
            )}

            {errorMessage && (
              <Alert severity="error" className="mb-4">
                {errorMessage}
              </Alert>
            )}

            {!isEditingSubsidiaryBase ? (
              <Box className="space-y-3">
                <div className="flex items-center gap-2">
                  <LocationOnIcon color="action" />
                  <div>
                    <Typography variant="body2" color="text.secondary">
                      Subsidiary
                    </Typography>
                    <Typography variant="body1">
                      {user.subsidiary ? `${user.subsidiary.name} (${user.subsidiary.icaoCode})` : 'Not assigned'}
                    </Typography>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <LocationOnIcon color="action" />
                  <div>
                    <Typography variant="body2" color="text.secondary">
                      Base
                    </Typography>
                    <Typography variant="body1">
                      {user.base ? `${user.base.name} - ${user.base.city}, ${user.base.state}` : 'Not assigned'}
                    </Typography>
                  </div>
                </div>
                
                {!hasOpenFlightDuty && (
                  <Box className="pt-3 border-t border-gray-200">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={handleEditSubsidiaryBase}
                      fullWidth
                    >
                      Change Subsidiary & Base
                    </Button>
                  </Box>
                )}
              </Box>
            ) : (
              <form onSubmit={handleSubmit(onSubmitSubsidiaryBase)} className="space-y-4">
                <Controller
                  control={control}
                  name="subsidiaryId"
                  rules={{ required: 'Subsidiary is required' }}
                  render={({ field }) => (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Subsidiary</InputLabel>
                      <Select
                        {...field}
                        label="Subsidiary"
                        error={!!errors.subsidiaryId}
                      >
                        {subsidiaries.map((subsidiary) => (
                          <MenuItem key={subsidiary.id} value={subsidiary.id}>
                            {subsidiary.name} ({subsidiary.icaoCode})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  control={control}
                  name="baseId"
                  rules={{ required: 'Base is required' }}
                  render={({ field }) => (
                    <FormControl size="small" fullWidth>
                      <InputLabel>Base</InputLabel>
                      <Select
                        {...field}
                        label="Base"
                        error={!!errors.baseId}
                        disabled={!selectedSubsidiary}
                      >
                        {selectedSubsidiary?.bases.map((base) => (
                          <MenuItem key={base.id} value={base.id}>
                            {base.name} - {base.city}, {base.state}
                            {base.baseAirports.length > 0 && (
                              <span className="text-gray-500 ml-2">
                                ({base.baseAirports.map(ba => ba.airportCode).join(', ')})
                              </span>
                            )}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />

                <div className="flex gap-2 text-slate-200">
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <LoadingButton
                    type="submit"
                    variant="contained"
                    color="secondary"
                    loading={loading}
                    startIcon={<SaveIcon />}
                    fullWidth
                  >
                    Save
                  </LoadingButton>
                </div>
              </form>
            )}
          </Card>
        </Grid>

        {/* Plan Management Card */}
        <Grid item xs={12} md={6}>
          <PlanManager />
        </Grid>

        {/* Account Statistics Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <Typography variant="h6" component="h3" gutterBottom>
              Account Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Member Since
                </Typography>
                <Typography variant="body1">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Account Status
                </Typography>
                <Typography variant="body1" color="success.main">
                  Active
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}