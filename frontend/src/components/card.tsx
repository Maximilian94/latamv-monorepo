import { ReactNode } from 'react';

export const Card = ({
  children,
  bgColor,
  borderColor,
}: {
  children: ReactNode;
  bgColor?: string;
  borderColor?: string;
}) => {
  return (
    <div
      className={`p-3 rounded-md w-full ${bgColor ? bgColor : 'bg-slate-900'} border border-solid box-border ${borderColor ? borderColor : 'border-slate-700'}`}
    >
      {children}
    </div>
  );
};
