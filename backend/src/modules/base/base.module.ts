import { Module } from '@nestjs/common';
import { BaseService } from './services/base.service';
import { BaseRepository } from './repositories/base.repository';
import { BaseController } from './controllers/base.controller';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { PermissionModule } from '../permission/permission.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  controllers: [BaseController],
  providers: [BaseService, BaseRepository],
  imports: [
    PrismaModule,
    PermissionModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  exports: [BaseService],
})
export class BaseModule {}
