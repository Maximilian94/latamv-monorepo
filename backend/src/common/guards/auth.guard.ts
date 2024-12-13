import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PermissionService } from '../../modules/permission/services/permission.service';

interface CustomRequest extends Request {
  headers: {
    authorization?: string;
    [key: string]: string | undefined;
  };
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
  permissions?: string[]; // Ou o tipo apropriado para suas permissões
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const user = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      const permissions =
        await this.permissionService.getPermissionsByUser(user);
      request['user'] = user;
      request['permissions'] = permissions;
    } catch {
      throw new UnauthorizedException(
        'Sua sessão expirou. Por favor, faça login novamente para continuar.',
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: CustomRequest): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
