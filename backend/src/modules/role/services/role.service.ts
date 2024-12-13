import { Injectable } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class RoleService {
  constructor(private roleRepository: RoleRepository) {}

  async getUserRolesByUserId(userId: number) {
    return this.roleRepository.getRolesByUserId(userId);
  }
}
