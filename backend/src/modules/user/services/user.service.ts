import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

export type GenerateFlightDutyParams = {
  numberOfFlights?: number;
  doNotRepeatAirport?: boolean;
};

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configService: ConfigService,
  ) {}

  async createUser(data: Prisma.UserCreateArgs['data']) {
    const saltOrRounds = Number(this.configService.get('BCRYPT_ROUNDS'));
    data.password = await bcrypt.hash(data.password, saltOrRounds);

    try {
      return await this.userRepository.createUser(data);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Lidando com erro de chave única
        if (error.code === 'P2002') {
          const field = error.meta?.target;
          const fieldsDescription = Array.isArray(field)
            ? field.join(', ')
            : field;
          throw new ConflictException(
            `Field${Array.isArray(field) && field.length > 1 ? 's' : ''} ${fieldsDescription} have already been used by another user.`,
          );
        }
        // Adicione outros códigos de erro específicos da Prisma conforme necessário
      }
      throw new InternalServerErrorException(
        'Failed to create user due to unexpected error.',
      );
    }
  }

  async findOneWitPassword(emailOrUsername: string) {
    return this.userRepository.findOne(emailOrUsername);
  }

  async getAllUsers() {
    return this.userRepository.findMany();
  }
}
