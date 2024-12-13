import { PrismaModule } from 'src/database/prisma/prisma.module';
import { PermissionController } from './controllers/permission.controller';
import { PermissionService } from './services/permission.service';
import { PermissionRepository } from './repositories/permission.repository';
import { Module } from '@nestjs/common';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository],
  imports: [PrismaModule, RoleModule],
  exports: [PermissionService],
})
export class PermissionModule {}
