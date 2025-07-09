import { Controller } from '@nestjs/common';
import { RoleRepository } from '../repositories/role.repository';

@Controller('role')
export class RoleController {
  constructor(private roleRepository: RoleRepository) {}

  getUserRole(id: number) {
    return this.roleRepository.getRolesByUserId(id);
  }
}
