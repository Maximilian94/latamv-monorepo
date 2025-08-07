import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './services/user.service';
import { UserRepository } from './repositories/user.repository';
import { UserController } from './controllers/user.controller';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { AuthGuard } from '../../common/guards/auth.guard';
import { FlightDutyModule } from '../flightDuty/flightDuty.module';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository, AuthGuard],
  imports: [PrismaModule, PermissionModule, forwardRef(() => FlightDutyModule)],
  exports: [UserService],
})
export class UserModule {}
