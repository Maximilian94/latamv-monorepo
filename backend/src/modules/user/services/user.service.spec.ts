import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { ConfigService } from '@nestjs/config';
import { TypedEventEmitter } from '../../../common/modules/event-emitter/controllers/event-emitter.controller';
import { Prisma } from '@prisma/client';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UserEvent } from '../enums/user-event.enum';

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepository;
  let configService: ConfigService;
  let eventEmitter: TypedEventEmitter;

  const mockUserRepository = {
    createUser: jest.fn(),
    findOne: jest.fn(),
    findMany: jest.fn(),
    findByUsernameOrEmail: jest.fn(),
    login: jest.fn(),
    updateUserPlan: jest.fn(),
    updateUserBase: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: TypedEventEmitter,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<TypedEventEmitter>(TypedEventEmitter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserData: Prisma.UserCreateInput = {
      name: 'João Silva',
      email: 'joao@email.com',
      username: 'joao123',
      password: 'senha123',
      plan: 'FREE',
      base: {
        connect: { id: 1 },
      },
    };

    const mockCreatedUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      username: 'joao123',
      password: 'hashedPassword',
      plan: 'FREE',
      baseId: 1,
      base: {
        id: 1,
        name: 'Base Test',
        city: 'São Paulo',
        state: 'SP',
      },
      roles: [
        {
          id: 2,
          name: 'Pilot',
        },
      ],
      createdAt: new Date(),
      updateAt: new Date(),
    };

    beforeEach(() => {
      mockConfigService.get.mockReturnValue('10'); // BCRYPT_ROUNDS
    });

    it('should create a user with hashed password and Pilot role', async () => {
      // Arrange
      mockUserRepository.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.createUser(mockUserData);

      // Assert
      expect(mockConfigService.get).toHaveBeenCalledWith('BCRYPT_ROUNDS');
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockUserData,
          password: expect.any(String), // Hashed password
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(UserEvent.CREATED, {
        user: expect.objectContaining({
          id: mockCreatedUser.id,
          name: mockCreatedUser.name,
          email: mockCreatedUser.email,
          username: mockCreatedUser.username,
          plan: mockCreatedUser.plan,
          baseId: mockCreatedUser.baseId,
          base: mockCreatedUser.base,
          roles: mockCreatedUser.roles,
          createdAt: mockCreatedUser.createdAt,
          updateAt: mockCreatedUser.updateAt,
        }),
      });
      expect(result).toEqual({
        ...mockCreatedUser,
        password: mockCreatedUser.password,
      });
    });

    it('should include Pilot role in the created user', async () => {
      // Arrange
      mockUserRepository.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await service.createUser(mockUserData);

      // Assert
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toEqual({
        id: 2,
        name: 'Pilot',
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError('', {
        code: 'P2002',
        clientVersion: '1.0.0',
        meta: { target: ['email'] },
      });
      mockUserRepository.createUser.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.createUser(mockUserData)).rejects.toThrow(
        ConflictException,
      );
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      // Arrange
      const unexpectedError = new Error('Database connection failed');
      mockUserRepository.createUser.mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(service.createUser(mockUserData)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should hash password before creating user', async () => {
      // Arrange
      mockUserRepository.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      await service.createUser(mockUserData);

      // Assert
      expect(mockUserRepository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          password: expect.not.stringMatching('senha123'), // Should be hashed
        }),
      );
    });
  });
}); 