import React, { useState, useEffect } from 'react';
import { Chip, Tooltip, IconButton } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import dayjs from 'dayjs';

interface VersionInfo {
  version: string;
  buildDate: string;
  commitHash: string;
  environment: string;
}

interface VersionDisplayProps {
  variant?: 'chip' | 'text' | 'icon';
  showDetails?: boolean;
  className?: string;
}

export const VersionDisplay: React.FC<VersionDisplayProps> = ({
  variant = 'chip',
  showDetails = false,
  className = ''
}) => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        // Try to get version from local version.json first
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          setVersionInfo(data);
        } else {
          // Fallback to backend API
          const apiResponse = await fetch('/api/version');
          if (apiResponse.ok) {
            const result = await apiResponse.json();
            setVersionInfo(result.data);
          } else {
            throw new Error('Failed to fetch version');
          }
        }
      } catch (err) {
        setError('Version unavailable');
        console.warn('Failed to fetch version info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, []);

  if (loading) {
    return <span className={className}>Loading version...</span>;
  }

  if (error || !versionInfo) {
    return <span className={className}>v{error || 'unknown'}</span>;
  }

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('MMM DD, YYYY HH:mm');
  };

  const getEnvironmentColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'production':
        return 'success';
      case 'staging':
        return 'warning';
      case 'development':
        return 'info';
      default:
        return 'default';
    }
  };

  const versionText = `v${versionInfo.version}`;
  const tooltipContent = showDetails ? (
    <div>
      <div><strong>Version:</strong> {versionInfo.version}</div>
      <div><strong>Build Date:</strong> {formatDate(versionInfo.buildDate)}</div>
      <div><strong>Commit:</strong> {versionInfo.commitHash.substring(0, 8)}</div>
      <div><strong>Environment:</strong> {versionInfo.environment}</div>
    </div>
  ) : versionText;

  switch (variant) {
    case 'icon':
      return (
        <Tooltip title={tooltipContent} arrow>
          <IconButton size="small" className={className}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );

    case 'text':
      return (
        <Tooltip title={tooltipContent} arrow>
          <span className={className} style={{ cursor: 'help' }}>
            {versionText}
          </span>
        </Tooltip>
      );

    case 'chip':
    default:
      return (
        <Tooltip title={tooltipContent} arrow>
          <Chip
            label={versionText}
            size="small"
            color={getEnvironmentColor(versionInfo.environment) as
              | 'default'
              | 'success'
              | 'warning'
              | 'info'
              | 'error'
              | 'primary'
              | 'secondary'
              | undefined}
            variant="outlined"
            className={className}
          />
        </Tooltip>
      );
  }
};

export default VersionDisplay; 