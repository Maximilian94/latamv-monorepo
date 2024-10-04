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

    if (
      !this.isPasswordMatching(isPasswordEncripted, user.password, passwordSent)
    ) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const { password, ...payload } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
    return {
      authToken: await this.jwtService.signAsync(payload),
      user: payload,
    };
  }

  async register(params: Prisma.UserCreateInput) {
    const user = await this.usersService.createUser(params);
    console.log('user', user);
    const user2 = await this.signIn(user.email, user.password);
    console.log('user2', user2);
    return user2;
  }

  async validateToken(token: string) {
    const user = await this.jwtService.verify(token);
  }

  private isPasswordMatching = async (
    isPasswordEncripted: boolean,
    password1: string,
    password2: string,
  ) => {
    if (isPasswordEncripted) return password1 === password2;
    return await bcrypt.compare(password1, password2);
  };
}
