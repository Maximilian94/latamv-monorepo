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

  async getPermissionsByUserId({ userId }: { userId: number }) {
    const userRoles = await this.roleService.getUserRolesByUserId({ userId });
    return this.permissionRepository.getPermissionsByRolesId(
      userRoles.map((role) => role.id),
    );
  }
}
