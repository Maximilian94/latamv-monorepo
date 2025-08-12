import { Award } from './award.interface';

export interface UserAward {
  id: number;
  userId: number;
  awardId: number;
  obtainedAt: Date;
  expiresAt: Date;
  updatedAt: Date;
  award?: Award;
}

export interface AwardWithUserAward extends Award {
  userAward?: UserAward;
  isExpired?: boolean;
  daysUntilExpiration?: number;
}
