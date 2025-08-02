import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}

  async getUserRolesByUserId({ userId }: { userId: number }) {
    return this.roleRepository.getRolesByUserId(userId);
  }

  async assignRoleToUser(userId: number, roleId: number) {
    return this.roleRepository.assignRoleToUser(userId, roleId);
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    return this.roleRepository.removeRoleFromUser(userId, roleId);
  }
}
