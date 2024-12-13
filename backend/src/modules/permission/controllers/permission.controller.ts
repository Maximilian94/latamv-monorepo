import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { PermissionService } from '../services/permission.service';
import { GetUser } from '../../../common/decorator/getUser.decorator';

@Controller('permission')
export class PermissionController {
  constructor(private permissionService: PermissionService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  async getMyPermissions(@GetUser() user: any) {
    return this.permissionService.getPermissionsByUser(user);
  }
}
