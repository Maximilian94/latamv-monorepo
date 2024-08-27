import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnModuleInit } from '@nestjs/common';

type User = {
  name: string;
};

const USERS: { [key: string]: User } = {
  '123': { name: 'Max' },
  '456': { name: 'Alex' },
};

@WebSocketGateway({ cors: true })
export class MyGateway
  implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  userConnections = new Map<string, Set<string>>();

  addConnection(token: string, websocketId: string) {
    const userId = this.getUserIdFromToken(token);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set<string>());
    }
    this.userConnections.get(userId)?.add(websocketId);
  }

  removeConnection(token: string, websocketId: string) {
    const userId = this.getUserIdFromToken(token);

    if (!this.userConnections.has(userId)) return;
    const connectionSet = this.userConnections.get(userId);
    connectionSet?.delete(websocketId);
    if (connectionSet.size == 0) this.userConnections.delete(userId);
  }

  getUserConnectionsFromToken(token: string) {
    const userId = this.getUserIdFromToken(token);
    return this.userConnections.get(userId);
  }

  getUserIdFromToken(token: string) {
    return token;
  }

  getUserFromToken(token: string) {
    return USERS[token];
  }

  handleConnection(client: Socket) {
    const token: string = client.handshake.auth.token;
    if (!token) {
      return client.disconnect();
    }
    this.addConnection(token, client.id);
    this.newUserConnected(
      this.getUserConnectionsFromToken(token),
      this.getUserFromToken(token),
    );
  }

  handleDisconnect(client: Socket): any {
    const token = client.handshake.auth.token;
    this.removeConnection(token, client.id);
  }

  onModuleInit() {}

  @SubscribeMessage('newMessage')
  newUserConnected(excludeSocketIds: Set<string>, user: User) {
    this.server.except(Array.from(excludeSocketIds)).emit('newUserConnected', {
      user,
    });
  }
}
