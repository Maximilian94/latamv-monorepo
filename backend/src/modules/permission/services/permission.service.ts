import { Injectable } from '@nestjs/common';
import { PermissionRepository } from '../repositories/permission.repository';
import { User } from '@prisma/client';
import { RoleService } from '../../role/services/role.service';

type OmitUser = Omit<User, 'password'>;

@Injectable()
export class PermissionService {
  constructor(
    private permissionRepository: PermissionRepository,
    private roleService: RoleService,
  ) {}

  async getPermissionsByUser(user: OmitUser) {
    const userRoles = await this.roleService.getUserRolesByUserId(user.id);
    return this.permissionRepository.getPermissionsByRolesId(
      userRoles.map((role) => role.id),
    );
  }
}
