import { Global, Module } from '@nestjs/common';
import { TypedEventEmitter } from './controllers/event-emitter.controller';

@Global()
@Module({
  providers: [TypedEventEmitter],
  exports: [TypedEventEmitter],
})
export class EventEmitterModule {}
