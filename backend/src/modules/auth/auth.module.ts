import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.model';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AuthGuard } from '../../common/guards/auth.guard';
import { PermissionModule } from '../permission/permission.module';
import { RoleModule } from '../role/role.module';
import { FlightModule } from '../flight/flight.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    PermissionModule,
    RoleModule,
    FlightModule,
  ],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
