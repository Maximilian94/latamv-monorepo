import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Prisma } from '@prisma/client';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUserData: Prisma.UserCreateInput = {
      name: 'João Silva',
      email: 'joao@email.com',
      username: 'joao123',
      password: 'hashedPassword',
      plan: 'FREE',
      base: {
        connect: { id: 1 },
      },
    };

    const mockCandidateRole = {
      id: 2,
      name: 'Candidate',
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
          name: 'Candidate',
        },
      ],
      createdAt: new Date(),
      updateAt: new Date(),
    };

    it('should create a user and automatically assign Candidate role', async () => {
      // Arrange
      mockPrismaService.role.findFirst.mockResolvedValue(mockCandidateRole);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await repository.createUser(mockUserData);

      // Assert
      expect(mockPrismaService.role.findFirst).toHaveBeenCalledWith({
        where: { name: 'Candidate' },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...mockUserData,
                  roles: {
          connect: { id: mockCandidateRole.id },
        },
        },
        select: {
          email: true,
          id: true,
          name: true,
          username: true,
          password: true,
          plan: true,
          baseId: true,
          base: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
            },
          },
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updateAt: true,
        },
      });
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw error when Candidate role is not found', async () => {
      // Arrange
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.createUser(mockUserData)).rejects.toThrow(
        'Candidate role not found',
      );
      expect(mockPrismaService.role.findFirst).toHaveBeenCalledWith({
        where: { name: 'Candidate' },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should include roles in the response', async () => {
      // Arrange
      mockPrismaService.role.findFirst.mockResolvedValue(mockCandidateRole);
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await repository.createUser(mockUserData);

      // Assert
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toEqual({
        id: 2,
        name: 'Pilot',
      });
    });
  });
}); 