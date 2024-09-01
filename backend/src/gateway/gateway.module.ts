import { Module } from '@nestjs/common';
import { MyGateway } from './gateway';
import { UserModule } from '../modules/user/user.model';

@Module({
  providers: [MyGateway],
  imports: [UserModule],
})
export class GatewayModule {}
