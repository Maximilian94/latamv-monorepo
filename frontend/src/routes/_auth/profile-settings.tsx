import { createFileRoute, useRouter } from '@tanstack/react-router';
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import LoadingButton from '@mui/lab/LoadingButton';
import { useState, useEffect } from 'react';
import { MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { useAuth } from '../../context/auth.context';
import api from '../../services/api';

interface ProfileSettingsForm {
  subsidiaryId: number;
  baseId: number;
}

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

const ProfileSettings = () => {
  const [loading, setLoading] = useState(false);
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [selectedSubsidiary, setSelectedSubsidiary] = useState<Subsidiary | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user, setUserAndToken } = useAuth();
  const route = useRouter();

  const {
    control,
    formState: { errors },
    watch,
    setValue,
    handleSubmit,
  } = useForm<ProfileSettingsForm>({
    mode: 'onChange',
    defaultValues: {
      subsidiaryId: user?.subsidiaryId || 1,
      baseId: user?.baseId || 1,
    },
  });

  const subsidiaryId = watch('subsidiaryId');

  // Fetch subsidiaries on component mount
  useEffect(() => {
    const fetchSubsidiaries = async () => {
      try {
        const response = await api.get('/subsidiaries/with-bases');
        setSubsidiaries(response.data);
        
        // Set initial selected subsidiary
        const currentSubsidiary = response.data.find((s: Subsidiary) => s.id === user?.subsidiaryId);
        setSelectedSubsidiary(currentSubsidiary || response.data[0]);
      } catch (error) {
        console.error('Error fetching subsidiaries:', error);
        setErrorMessage('Failed to load subsidiaries');
      }
    };

    fetchSubsidiaries();
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

  const onSubmit: SubmitHandler<ProfileSettingsForm> = async (data) => {
    try {
      setLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      const response = await api.patch(`/users/${user?.id}/subsidiary-base`, {
        subsidiaryId: data.subsidiaryId,
        baseId: data.baseId,
      });

      // Update user context with new data
      setUserAndToken({
        authToken: response.data.authToken,
        user: response.data.user,
      });

      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Typography variant="h4" component="h1" className="mb-6 text-center">
          Profile Settings
        </Typography>

        <Card>
          <CardContent className="space-y-6">
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outlined"
                  onClick={() => route.navigate({ to: '/' })}
                  fullWidth
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  variant="contained"
                  loading={loading}
                  fullWidth
                >
                  Update Profile
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/_auth/profile-settings')({
  component: ProfileSettings,
});