import { ConflictException, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { Prisma, User } from '@prisma/client';

export type GenerateFlightDutyParams = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async createUser(data: User) {
    try {
      return await this.userRepository.createUser(data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const field = error.meta?.target;
          if (typeof field === 'string') {
            throw new ConflictException(
              `${field.charAt(0).toUpperCase() + field.slice(1)} have already been used by another user.`,
            );
          } else if (Array.isArray(field)) {
            const fields = field.join(', ');
            throw new ConflictException(
              `Field${field.length > 1 ? 's' : ''} ${fields} have already been used by another user.`,
            );
          }
        }
      }
      throw error;
    }
  }
}
