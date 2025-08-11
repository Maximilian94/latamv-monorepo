import React, { ReactNode } from 'react';
import { useAuth } from '../../context/auth.context.tsx';
import { Permission } from '../../services/auth.service.ts';
import { Tooltip } from '@mui/material';

interface ProtectedLinkProps {
  requiredPermission: Array<Permission['name']>;
  tooltipMessage?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  requiredPermission,
  tooltipMessage = 'Você precisa ser piloto efetivado para ter acesso a esta funcionalidade',
  children,
  onClick,
  className = '',
  disabled = false,
}) => {
  const { hasPermission } = useAuth();
  const hasRequiredPermission = requiredPermission.length === 0 || hasPermission(requiredPermission);
  const isDisabled = disabled || !hasRequiredPermission;

  const handleClick = (e: React.MouseEvent) => {
    if (isDisabled) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const content = (
    <div
      onClick={handleClick}
      className={`${className} ${
        isDisabled 
          ? 'opacity-50 cursor-not-allowed pointer-events-none' 
          : 'cursor-pointer'
      }`}
    >
      {children}
    </div>
  );

  if (isDisabled) {
    return (
      <Tooltip title={tooltipMessage} arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default ProtectedLink;
