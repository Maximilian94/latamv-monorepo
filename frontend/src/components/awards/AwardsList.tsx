import React, { useState, useEffect } from 'react';
import { AwardCard } from './AwardCard';
import { AwardsService, AwardWithUserAward } from '../../services/awards.service';
import { useAuth } from '../../hooks/useAuth';

interface AwardsListProps {
  showUserAwardsOnly?: boolean;
  showActions?: boolean;
}

export const AwardsList: React.FC<AwardsListProps> = ({
  showUserAwardsOnly = false,
  showActions = true,
}) => {
  const [awards, setAwards] = useState<AwardWithUserAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadAwards();
  }, [user?.id]);

  const loadAwards = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await AwardsService.getAllAwardsWithUserStatus(user.id);
      
      if (showUserAwardsOnly) {
        const userAwards = data.filter(award => award.userAward);
        setAwards(userAwards);
      } else {
        setAwards(data);
      }
    } catch (err) {
      setError('Failed to load awards');
      console.error('Error loading awards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleObtainAward = async (awardId: number) => {
    if (!user?.id) return;

    try {
      await AwardsService.obtainAward(awardId);
      await loadAwards(); // Reload to get updated status
    } catch (err) {
      console.error('Error obtaining award:', err);
      setError('Failed to obtain award');
    }
  };

  const handleRemoveAward = async (awardId: number) => {
    if (!user?.id) return;

    try {
      await AwardsService.removeUserAward(user.id, awardId);
      await loadAwards(); // Reload to get updated status
    } catch (err) {
      console.error('Error removing award:', err);
      setError('Failed to remove award');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAwards}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (awards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {showUserAwardsOnly ? 'You have no awards yet.' : 'No awards available.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {awards.map((award) => (
        <AwardCard
          key={award.id}
          award={award}
          onObtain={handleObtainAward}
          onRemove={handleRemoveAward}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
