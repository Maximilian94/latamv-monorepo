import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/services/user.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PermissionService } from '../../permission/services/permission.service';
import { FlightService } from '../../flight/services/flight.service';
import { RoleService } from '../../role/services/role.service';
import { AuthenticatedRequest } from '../../../common/guards/auth.guard';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private permissionService: PermissionService,
    private roleService: RoleService,
    private flightService: FlightService,
  ) {}

  async signIn(
    emailOrUsername: string,
    passwordSent: string,
    isPasswordEncripted: boolean = false,
  ) {
    const user = await this.usersService.findUser({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordMatching = await this.isPasswordMatching(
      isPasswordEncripted,
      user.password,
      passwordSent,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const { password, ...payload } = user;
    const additionalData = await this.getAdditionalData({ userId: payload.id });

    return {
      authToken: await this.jwtService.signAsync(payload),
      user: { payload, ...additionalData },
    };
  }

  async validateToken(authenticatedRequest: AuthenticatedRequest) {
    const additionalData = await this.getAdditionalData({
      userId: authenticatedRequest.user.id,
    });
    return {
      user: { ...authenticatedRequest.user, ...additionalData },
    };
  }

  async getAdditionalData({ userId }: { userId: number }) {
    const permissions = await this.permissionService.getPermissionsByUserId({
      userId,
    });

    const userRole = await this.roleService.getUserRolesByUserId({ userId });

    const flightHours = await this.flightService.getFlightHoursByUser({
      userId,
    });

    return {
      permissions,
      roles: userRole,
      flightHours,
    };
  }

  async register(params: Prisma.UserCreateInput) {
    const user = await this.usersService.createUser(params);
    return await this.signIn(user.email, user.password, true);
  }

  private isPasswordMatching = async (
    isPasswordEncripted: boolean,
    password1: string,
    password2: string,
  ) => {
    if (isPasswordEncripted) return password1 === password2;
    return await bcrypt.compare(password2, password1);
  };
}
