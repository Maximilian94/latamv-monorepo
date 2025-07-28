import { Module, forwardRef } from '@nestjs/common';
import { MyGateway } from './gateway';
import { UserModule } from '../modules/user/user.model';

@Module({
  providers: [MyGateway],
  imports: [forwardRef(() => UserModule)],
})
export class GatewayModule {}
