import { Chip } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

interface PlanBadgeProps {
  plan: 'FREE' | 'GOLD';
}

export default function PlanBadge({ plan }: PlanBadgeProps) {
  const isGold = plan === 'GOLD';
  
  return (
    <Chip
      icon={isGold ? <Star /> : <StarBorder />}
      label={plan}
      color={isGold ? 'warning' : 'default'}
      variant={isGold ? 'filled' : 'outlined'}
      size="small"
      sx={{
        fontSize: '0.75rem',
        height: '24px',
      }}
    />
  );
} 