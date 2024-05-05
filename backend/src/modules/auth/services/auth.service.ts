import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/services/user.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(emailOrUsername: string, password: string) {
    const user = await this.usersService.findOne(emailOrUsername);
    if (!user) throw new NotFoundException('User not found');
    const payload = { sub: user.id, username: user.username };
    if (user?.password !== password) {
      throw new UnauthorizedException();
    }
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
