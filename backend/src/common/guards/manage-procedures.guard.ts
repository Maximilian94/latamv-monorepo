import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionService } from '../../modules/permission/services/permission.service';

@Injectable()
export class ManageProceduresGuard implements CanActivate {
  constructor(private permissionService: PermissionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const permissions = await this.permissionService.getPermissionsByUserId({
      userId: user.id,
    });

    const hasManageProceduresPermission = permissions.some(
      (permission) => permission.name === 'MANAGE_PROCEDURES',
    );

    if (!hasManageProceduresPermission) {
      throw new ForbiddenException(
        'You do not have permission to manage procedures. Only procedure administrators can create or modify procedure versions.',
      );
    }

    return true;
  }
}
