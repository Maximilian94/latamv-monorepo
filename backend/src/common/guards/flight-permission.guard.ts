import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PermissionService } from '../../modules/permission/services/permission.service';

@Injectable()
export class FlightPermissionGuard implements CanActivate {
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

    const hasFlightPermission = permissions.some(
      (permission) => permission.name === 'GENERATE_FLIGHT',
    );

    if (!hasFlightPermission) {
      throw new ForbiddenException(
        'You do not have permission to generate flights. Only pilots and above can generate flight duties.',
      );
    }

    return true;
  }
}
