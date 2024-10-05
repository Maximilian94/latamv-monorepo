import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserService } from '../modules/user/services/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserEvent } from '../modules/user/enums/user-event.enum';
import { UserWithoutPassword } from '../modules/user/interfaces/user.interface';
import { TypedEventEmitter } from '../common/modules/event-emitter/controllers/event-emitter.controller';

type UserStatus = 'online' | 'offline';
type UserWithStatus = UserWithoutPassword & {
  status: UserStatus;
};

type UsersAndConnectionStatus = Map<User['id'], UserWithStatus>;

@WebSocketGateway({ cors: true })
export class MyGateway
  implements
    OnModuleInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit
{
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private eventEmitter: TypedEventEmitter,
  ) {}
  @WebSocketServer()
  server: Server;
  connectionByUserId = new Map<number, Set<string>>();
  usersAndConnectionStatus: UsersAndConnectionStatus = new Map();

  addConnection(userId: number, websocketId: string) {
    if (!this.connectionByUserId.has(userId)) {
      this.connectionByUserId.set(userId, new Set<string>());
    }
    this.connectionByUserId.get(userId)?.add(websocketId);
  }

  removeConnection(userId: number, websocketId: string) {
    const userConnection = this.usersAndConnectionStatus.get(userId);
    if (userConnection) userConnection.status = 'offline';

    if (!this.connectionByUserId.has(userId)) return;
    const connectionSet = this.connectionByUserId.get(userId);
    connectionSet?.delete(websocketId);
    if (connectionSet.size == 0) this.connectionByUserId.delete(userId);
  }

  getUserConnectionsFromToken(token: string) {
    const userId = this.getUserFromToken(token).id;
    return this.connectionByUserId.get(userId);
  }

  getUserFromToken(token: string): User {
    return this.jwtService.verify(token);
  }

  handleConnection(client: Socket) {
    const token: string = client.handshake.auth.token;
    if (!token) return client.disconnect();
    const userId = this.getUserFromToken(token).id;

    this.addConnection(userId, client.id);
    this.setUserStatus(userId, 'online');
    this.onNewUserConnected(
      this.getUserConnectionsFromToken(token),
      this.getUserFromToken(token),
    );
  }

  handleDisconnect(client: Socket): any {
    const token = client.handshake.auth.token;
    const user = this.getUserFromToken(token);

    this.setUserStatus(user.id, 'offline').then(() => {
      this.removeConnection(this.getUserFromToken(token).id, client.id);
      this.emitUserDisconected(user.id);
    });
  }

  async setUserStatus(userId: number, status: UserStatus) {
    try {
      let user = this.usersAndConnectionStatus.get(userId);
      if (user == undefined) {
        const { password, ...user } = await this.userService.findUser({
          where: { id: userId },
        });
        this.addUserOnUsersAndConnectionStatusList(user, status);
        return;
      }
      this.usersAndConnectionStatus.get(userId).status = status;
      return;
    } catch (e) {}
  }

  addUserOnUsersAndConnectionStatusList(
    user: UserWithoutPassword,
    status: UserStatus,
  ) {
    this.usersAndConnectionStatus.set(user.id, {
      ...user,
      status,
    });
  }

  onNewUserConnected(excludeSocketIds: Set<string>, user: User) {
    this.server.except(Array.from(excludeSocketIds)).emit('newUserConnected', {
      userId: user.id,
    });

    const users = [];
    for (const [id, userData] of this.usersAndConnectionStatus) {
      if (id !== user.id) {
        users.push(userData);
      }
    }

    excludeSocketIds.forEach((socketId) => {
      this.server.to(socketId).emit('usersAndConnectionStatus', {
        users: users,
      });
    });
    this.logUsersConnected();
  }

  emitUserDisconected(userId: number) {
    this.server.emit('userDisconected', { userId });
  }

  emitUserCreated(user: UserWithoutPassword) {
    this.server.emit('userCreated', { user });
  }

  logUsersConnected() {
    console.log(this.connectionByUserId);
  }

  async onModuleInit() {
    this.userService.getAllUsers().then((users) => {
      this.usersAndConnectionStatus = new Map();
      users.forEach((user) => {
        this.usersAndConnectionStatus.set(user.id, {
          ...user,
          status: 'offline',
        });
      });
      console.log('usersAndConnectionStatus', this.usersAndConnectionStatus);
    });
  }

  afterInit(server: any): any {
    this.eventEmitter.on(UserEvent.CREATED, (data) => {
      this.usersAndConnectionStatus.set(data.user.id, {
        ...data.user,
        status: 'offline',
      });
      this.emitUserCreated(data.user);
    });
  }
}
