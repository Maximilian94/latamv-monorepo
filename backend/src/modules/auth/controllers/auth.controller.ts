import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignInDto } from 'src/common/pipes/validation.pipe';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RegisterDto } from '../dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(
      signInDto.emailOrUsername,
      signInDto.password,
    );
  }

  @Post('register')
  register(@Body() registerParams: RegisterDto) {
    return this.authService.register({
      username: registerParams.username,
      password: registerParams.password,
      email: registerParams.email,
      name: registerParams.firstName + ' ' + registerParams.lastName,
    });
  }

  @UseGuards(AuthGuard)
  @Get('validate-token')
  validateToken(@Request() req) {
    return { user: req.user };
  }
}
