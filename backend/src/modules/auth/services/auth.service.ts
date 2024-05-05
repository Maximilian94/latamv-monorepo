import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(emailOrUsername: string, passwordSent: string) {
    const user = await this.usersService.findOneWitPassword(emailOrUsername);
    if (!user) throw new NotFoundException('User not found');
    const isPasswordMatching = await bcrypt.compare(
      passwordSent,
      user.password,
    );
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    const { password, ...payload } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
