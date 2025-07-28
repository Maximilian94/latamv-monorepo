import { useState } from 'react';
import {
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Card } from './card.tsx';
import { useAuth } from '../context/auth.context.tsx';
import { updateUserPlan } from '../services/user.service.ts';
import PlanBadge from './planBadge.tsx';
import toast from 'react-hot-toast';

export default function PlanManager() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpgradeToGold = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await updateUserPlan({ plan: 'GOLD' });
      toast.success('Plan updated to GOLD!');
      // Recarregar dados do usuário
      window.location.reload();
    } catch (error) {
      toast.error('Error updating plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeToFree = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await updateUserPlan({ plan: 'FREE' });
      toast.success('Plan updated to FREE!');
      // Recarregar dados do usuário
      window.location.reload();
    } catch (error) {
      toast.error('Error updating plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <span className='text-lg font-bold text-slate-200'>
              Your Plan
            </span>
            <Typography variant="body2" color="text.secondary">
              {user?.plan === 'GOLD' 
                ? 'You have access to all premium features'
                : 'Upgrade to GOLD to access premium features'
              }
            </Typography>
          </div>
          <PlanBadge plan={user?.plan || 'FREE'} />
        </div>
        
        <div className="mt-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            {user?.plan === 'GOLD' ? 'Manage Plan' : 'Upgrade Plan'}
          </Button>
        </div>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Manage Plan</DialogTitle>
        <DialogContent>
          <div className="space-y-4">
            <Alert severity="info">
              <Typography variant="body2">
                For now, all users start with the FREE plan. 
                The payment system will be implemented soon.
              </Typography>
            </Alert>
            
            <div className="space-y-2">
              <Typography variant="h6">Current Plan: {user?.plan}</Typography>
              
              {user?.plan === 'FREE' ? (
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={handleUpgradeToGold}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Upgrade to GOLD'}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  onClick={handleDowngradeToFree}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Downgrade to FREE'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 