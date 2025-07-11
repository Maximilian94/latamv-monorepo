import VerifiedIcon from '@mui/icons-material/Verified';
import { Severity } from '../../../services/latam/latam.types.ts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import ReportIcon from '@mui/icons-material/Report';
import React from 'react';
import { SvgIconProps } from '@mui/material/SvgIcon';
import { Tooltip } from '@mui/material';

export default function SeverityIcon({
  severity,
  amount,
}: {
  severity: number;
  amount: number;
}) {
  const colors: Record<number, string> = {
    [Severity.StandardCompliance]: 'green-500',
    [Severity.ProactiveExcellence]: 'cyan-600',
    [Severity.ProceduralDeviation]: 'yellow-500',
    [Severity.SafetyCompromise]: 'red-500',
  };

  const icons: Record<number, React.ComponentType<SvgIconProps>> = {
    [Severity.StandardCompliance]: CheckCircleIcon,
    [Severity.ProactiveExcellence]: VerifiedIcon,
    [Severity.ProceduralDeviation]: AnnouncementIcon,
    [Severity.SafetyCompromise]: ReportIcon,
  };

  const toolTip: Record<number, string> = {
    [Severity.StandardCompliance]: 'Standard Compliance',
    [Severity.ProactiveExcellence]: 'Proactive Excellence',
    [Severity.ProceduralDeviation]: 'Procedural Deviation',
    [Severity.SafetyCompromise]: 'Safety Compromise',
  };

  const IconComponent = icons[severity];

  return (
    <Tooltip title={`${toolTip[severity]}`}>
      <div className={`flex items-center gap-0.5 text-${colors[severity]}`}>
        <span>{amount}</span>
        <IconComponent fontSize="inherit" />
      </div>
    </Tooltip>
  );
}
