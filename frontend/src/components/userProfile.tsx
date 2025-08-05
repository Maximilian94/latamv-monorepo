import {
  Typography,
  Grid,
  Avatar,
  Divider,
  Box,
  Button,
} from '@mui/material';
import { useRouter } from '@tanstack/react-router';
import { Card } from './card.tsx';
import { useAuth } from '../context/auth.context.tsx';
import PlanManager from './planManager.tsx';
import { convertMinutesTo_HH_MM } from '../utils/flight.ts';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export default function UserProfile() {
  const { user } = useAuth();
  const router = useRouter();

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
            </Box>
            
            <Box className="mt-4">
              <Button
                variant="outlined"
                fullWidth
                onClick={() => router.navigate({ to: '/profile-settings' })}
              >
                Edit Profile Settings
              </Button>
            </Box>
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