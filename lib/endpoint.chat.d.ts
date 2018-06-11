import * as Redis from 'redis';
import * as SocketIO from 'socket.io';
import * as API from './api';
import * as API_ from './api_';
import { Endpoint } from './endpoint_';
export declare class ChatEndpoint extends Endpoint implements API.ChatAPI {
    constructor(privateAPI: API_.PrivateAPI, redisClient: Redis.RedisClient, socketServer: SocketIO.Server);
    newMessage(msg: string | API.MessageData, socket?: SocketIO.Socket): Promise<void>;
    protected _onClientConnect(socket: SocketIO.Socket): void;
}
