import React from 'react';
import { AwardsList } from '../components/awards/AwardsList';

export const AwardsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <AwardsList showUserAwardsOnly={false} showActions={false} />
    </div>
  );
};
