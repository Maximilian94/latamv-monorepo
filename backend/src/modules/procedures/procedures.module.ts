import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ProceduresController } from './controllers/procedures.controller';
import { ProceduresService } from './services/procedures.service';
import { ProceduresRepository } from './repositories/procedures.repository';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    PrismaModule,
    PermissionModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [ProceduresController],
  providers: [ProceduresService, ProceduresRepository],
  exports: [ProceduresService],
})
export class ProcedureModule {}
