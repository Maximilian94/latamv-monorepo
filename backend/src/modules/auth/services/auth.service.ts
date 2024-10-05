import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/services/user.service';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
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
    return {
      authToken: await this.jwtService.signAsync(payload),
      user: payload,
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
