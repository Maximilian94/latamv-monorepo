import { Controller, Post, Delete, Param, Body } from '@nestjs/common';
import { RoleService } from '../services/role.service';

@Controller('role')
export class RoleController {
  constructor(private roleService: RoleService) {}

  getUserRole(id: number) {
    return this.roleService.getUserRolesByUserId({ userId: id });
  }

  @Post('assign')
  assignRoleToUser(@Body() body: { userId: number; roleId: number }) {
    return this.roleService.assignRoleToUser(body.userId, body.roleId);
  }

  @Delete(':userId/role/:roleId')
  removeRoleFromUser(
    @Param('userId') userId: number,
    @Param('roleId') roleId: number,
  ) {
    return this.roleService.removeRoleFromUser(userId, roleId);
  }
}
