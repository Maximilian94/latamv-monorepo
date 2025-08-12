import React, { useState, useEffect, useCallback } from 'react';
import {
  AwardsService,
  AwardWithUserAward,
} from '../../services/awards.service';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/date';
import { Typography } from '@mui/material';
import { Card } from '../card';

export const UserAwardsCard: React.FC = () => {
  const [userAwards, setUserAwards] = useState<AwardWithUserAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadUserAwards = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await AwardsService.getAllAwardsWithUserStatus(user.id);
      const awards = data.filter((award) => award.userAward);
      setUserAwards(awards);
    } catch (err) {
      setError('Failed to load awards');
      console.error('Error loading user awards:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadUserAwards();
  }, [loadUserAwards]);

  if (loading) {
    return (
      <Card>
        <Typography variant="h6" component="h3" gutterBottom>
          My Awards
        </Typography>
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Typography variant="h6" component="h3" gutterBottom>
          My Awards
        </Typography>
        <p className="text-red-600 text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card>
      <Typography variant="h6" component="h3" gutterBottom>
        My Awards
      </Typography>

      {userAwards.length === 0 ? (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <p className="text-gray-600">You haven't earned any awards yet.</p>
          <p className="text-sm text-gray-500 mt-1">
            Complete missions and activities to earn achievements!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {userAwards.slice(0, 5).map((award) => (
            <Card key={award.id}>
              <div className="flex flex-col">
                <div className="flex justify-between items-center">
                  <div className="flex flex-start items-center gap-4">
                    {award.image && (
                      <img
                        src={award.image}
                        alt={award.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}

                    <span className="text-lg font-bold">{award.name}</span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        award.isExpired
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {award.isExpired ? 'Expired' : 'Active'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 mt-1">
                    Obtained: {formatDate(award.userAward?.obtainedAt ?? null)}
                  </span>

                  {award.userAward && !award.isExpired && (
                    <span className="text-xs text-gray-500">
                      Expires: {formatDate(award.userAward.expiresAt ?? null)}
                    </span>
                  )}
                </div>
 
              </div>
            </Card>
          ))}

          {userAwards.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                +{userAwards.length - 5} more awards
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
