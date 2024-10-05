import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPayloads } from '../interfaces/event-emitter.interface';

export class TypedEventEmitter extends EventEmitter2 {
  emit<K extends keyof EventPayloads>(
    event: K,
    payload: EventPayloads[K],
  ): boolean {
    return super.emit(event, payload);
  }

  on<K extends keyof EventPayloads>(
    event: K,
    listener: (payload: EventPayloads[K]) => void,
  ): this {
    return super.on(event, listener) as this;
  }
}
