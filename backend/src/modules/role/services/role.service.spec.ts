import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { RoleRepository } from '../repositories/role.repository';

describe('RoleService', () => {
  let service: RoleService;
  let repository: RoleRepository;

  const mockRoleRepository = {
    getRolesByUserId: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: RoleRepository,
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    repository = module.get<RoleRepository>(RoleRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserRolesByUserId', () => {
    const userId = 1;
    const mockRoles = [
      { id: 1, name: 'Admin' },
      { id: 2, name: 'Pilot' },
    ];

    it('should return user roles', async () => {
      // Arrange
      mockRoleRepository.getRolesByUserId.mockResolvedValue(mockRoles);

      // Act
      const result = await service.getUserRolesByUserId({ userId });

      // Assert
      expect(mockRoleRepository.getRolesByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockRoles);
    });

    it('should return empty array when user has no roles', async () => {
      // Arrange
      mockRoleRepository.getRolesByUserId.mockResolvedValue([]);

      // Act
      const result = await service.getUserRolesByUserId({ userId });

      // Assert
      expect(mockRoleRepository.getRolesByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe('assignRoleToUser', () => {
    const userId = 1;
    const roleId = 2;
    const mockUserWithRoles = {
      id: userId,
      name: 'João Silva',
      email: 'joao@email.com',
      username: 'joao123',
      plan: 'FREE',
      baseId: 1,
      base: {
        id: 1,
        name: 'Base Test',
        city: 'São Paulo',
        state: 'SP',
      },
      roles: [
        { id: 2, name: 'Pilot' },
      ],
      createdAt: new Date(),
      updateAt: new Date(),
    };

    it('should assign role to user successfully', async () => {
      // Arrange
      mockRoleRepository.assignRoleToUser.mockResolvedValue(mockUserWithRoles);

      // Act
      const result = await service.assignRoleToUser(userId, roleId);

      // Assert
      expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalledWith(userId, roleId);
      expect(result).toEqual(mockUserWithRoles);
    });

    it('should return user with updated roles', async () => {
      // Arrange
      mockRoleRepository.assignRoleToUser.mockResolvedValue(mockUserWithRoles);

      // Act
      const result = await service.assignRoleToUser(userId, roleId);

      // Assert
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0]).toEqual({
        id: 2,
        name: 'Pilot',
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRoleRepository.assignRoleToUser.mockRejectedValue(error);

      // Act & Assert
      await expect(service.assignRoleToUser(userId, roleId)).rejects.toThrow('Database error');
      expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalledWith(userId, roleId);
    });
  });

  describe('removeRoleFromUser', () => {
    const userId = 1;
    const roleId = 2;
    const mockUserWithoutRole = {
      id: userId,
      name: 'João Silva',
      email: 'joao@email.com',
      username: 'joao123',
      plan: 'FREE',
      baseId: 1,
      base: {
        id: 1,
        name: 'Base Test',
        city: 'São Paulo',
        state: 'SP',
      },
      roles: [], // Role removed
      createdAt: new Date(),
      updateAt: new Date(),
    };

    it('should remove role from user successfully', async () => {
      // Arrange
      mockRoleRepository.removeRoleFromUser.mockResolvedValue(mockUserWithoutRole);

      // Act
      const result = await service.removeRoleFromUser(userId, roleId);

      // Assert
      expect(mockRoleRepository.removeRoleFromUser).toHaveBeenCalledWith(userId, roleId);
      expect(result).toEqual(mockUserWithoutRole);
    });

    it('should return user with updated roles (role removed)', async () => {
      // Arrange
      mockRoleRepository.removeRoleFromUser.mockResolvedValue(mockUserWithoutRole);

      // Act
      const result = await service.removeRoleFromUser(userId, roleId);

      // Assert
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockRoleRepository.removeRoleFromUser.mockRejectedValue(error);

      // Act & Assert
      await expect(service.removeRoleFromUser(userId, roleId)).rejects.toThrow('Database error');
      expect(mockRoleRepository.removeRoleFromUser).toHaveBeenCalledWith(userId, roleId);
    });
  });
}); 