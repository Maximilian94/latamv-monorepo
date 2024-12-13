import React, { ReactNode } from 'react';
import { useAuth } from '../../context/auth.context.tsx';
import { Permission } from '../../services/auth.service.ts';

interface ProtectedElementProps {
  requiredPermission: Array<Permission['name']>;
  fallback?: ReactNode;
  children: ReactNode;
}

const ProtectedElement: React.FC<ProtectedElementProps> = ({
  requiredPermission,
  fallback = null,
  children,
}) => {
  const { hasPermission } = useAuth();

  if (requiredPermission.length == 0 || hasPermission(requiredPermission)) {
    return <>{children}</>;
  } else {
    return <>{fallback}</>;
  }
};

export default ProtectedElement;
