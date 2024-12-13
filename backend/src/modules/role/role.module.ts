import { PrismaModule } from 'src/database/prisma/prisma.module';
import { Module } from '@nestjs/common';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';
import { RoleRepository } from './repositories/role.repository';

@Module({
  controllers: [RoleController],
  providers: [RoleService, RoleRepository],
  imports: [PrismaModule],
  exports: [RoleService],
})
export class RoleModule {}
