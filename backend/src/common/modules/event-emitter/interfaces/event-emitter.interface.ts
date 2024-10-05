import { UserEvent } from '../../../../modules/user/enums/user-event.enum';
import { UserWithoutPassword } from '../../../../modules/user/interfaces/user.interface';

export interface EventPayloads {
  [UserEvent.CREATED]: { user: UserWithoutPassword };
  [UserEvent.UPDATED]: { user: UserWithoutPassword };
  [UserEvent.DELETED]: { userId: string };
}
