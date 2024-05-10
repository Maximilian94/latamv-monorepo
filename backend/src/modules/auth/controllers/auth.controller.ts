import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignInDto } from 'src/common/pipes/validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    console.log('emailOrUsername', signInDto.emailOrUsername);
    return this.authService.signIn(
      signInDto.emailOrUsername,
      signInDto.password,
    );
  }
}
