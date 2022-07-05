import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Chatting } from './models/chattings.model';
import { Model } from 'mongoose';
import { Socket as SocketModel } from './models/sockets.model';
@WebSocketGateway({ namespace: 'chattings' })
export class ChatsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private logger = new Logger('chat');

  constructor(
    @InjectModel(Chatting.name) private readonly chattingModel: Model<Chatting>,
    @InjectModel(SocketModel.name)
    private readonly socketModel: Model<SocketModel>,
  ) {
    this.logger.log('constructor');
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log(`disconnected: ${socket.id} ${socket.nsp.name}`);
    const user = await this.socketModel.findOne({ id: socket.id });
    if (user) {
      socket.broadcast.emit('disconnect_user', user.username);
      await user.delete();
    }
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log('connect');
    this.logger.log(`connected: ${socket.id} ${socket.nsp.name}`);
  }

  afterInit() {
    this.logger.log('init');
  }

  @SubscribeMessage('new_user')
  async handleNewUser(
    @MessageBody() username: String,
    @ConnectedSocket() socket: Socket,
  ) {
    //username db에 적재
    const exist = await this.socketModel.exists({ username });
    if (exist) {
      username = `{username}_${Math.floor(Math.random() * 100)}`;
      await this.socketModel.create({
        id: socket.id,
        username,
      });
    }
    socket.broadcast.emit('user_connected', username);
    return username;
  }

  @SubscribeMessage('submit_chat')
  async handleSubmitChat(
    @MessageBody() chat: String,
    @ConnectedSocket() socket: Socket,
  ) {
    const socketObj = await this.socketModel.findOne({ id: socket.id });
    await this.chattingModel.create({
      user: socketObj,
      chat: chat,
    });

    socket.broadcast.emit('new_chat', {
      chat,
      username: socket.id,
    });
  }
}
