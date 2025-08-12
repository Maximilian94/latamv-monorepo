import React from 'react';
import { AwardWithUserAward } from '../../services/awards.service';
import { formatDate } from '../../utils/date';
import { Card } from '../card';
import { Typography, Button, Chip } from '@mui/material';
import { CheckCircle, Cancel, Warning } from '@mui/icons-material';

interface AwardCardProps {
  award: AwardWithUserAward;
  onObtain?: (awardId: number) => void;
  onRemove?: (awardId: number) => void;
  showActions?: boolean;
}

export const AwardCard: React.FC<AwardCardProps> = ({
  award,
  onObtain,
  onRemove,
  showActions = true,
}) => {
  const hasAward = !!award.userAward;
  const isExpired = award.isExpired;
  const daysUntilExpiration = award.daysUntilExpiration;

  const getStatusInfo = () => {
    if (!hasAward) {
      return {
        icon: <Cancel color="disabled" />,
        text: 'Not obtained',
        color: 'default' as const,
        bgColor: 'bg-gray-50',
      };
    }
    if (isExpired) {
      return {
        icon: <Warning color="error" />,
        text: 'Expired',
        color: 'error' as const,
        bgColor: 'bg-red-50',
      };
    }
    if (daysUntilExpiration && daysUntilExpiration <= 7) {
      return {
        icon: <Warning color="warning" />,
        text: `Expires in ${daysUntilExpiration} days`,
        color: 'warning' as const,
        bgColor: 'bg-yellow-50',
      };
    }
    return {
      icon: <CheckCircle color="success" />,
      text: 'Active',
      color: 'success' as const,
      bgColor: 'bg-green-50',
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {award.image && (
            <img
              src={award.image}
              alt={award.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div>
            <Typography variant="h6" component="h3" gutterBottom>
              {award.name}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {award.description}
            </Typography>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {statusInfo.icon}
          <Chip
            label={statusInfo.text}
            color={statusInfo.color}
            size="small"
            variant="outlined"
          />
        </div>
      </div>

      <div className="mb-4">
        <Typography variant="body2" className="mb-2">
          {award.tooltip}
        </Typography>
        <div className="text-xs text-gray-500">
          <p>Validity: {award.validityDuration} days</p>
          {hasAward && award.userAward && (
            <>
              <p>Obtained: {formatDate(award.userAward.obtainedAt)}</p>
              <p>Expires: {formatDate(award.userAward.expiresAt)}</p>
            </>
          )}
        </div>
      </div>

      {showActions && (
        <div className="flex space-x-2">
          {!hasAward ? (
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => onObtain?.(award.id)}
            >
              Obtain Award
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={() => onRemove?.(award.id)}
            >
              Remove Award
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
