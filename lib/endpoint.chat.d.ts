import * as Redis from 'redis';
import * as SocketIO from 'socket.io';
import * as API from 'pxt-cloud-api';
import { Endpoint, Endpoints } from './endpoint_';
export declare class ChatEndpoint extends Endpoint implements API.ChatAPI {
    protected _debug: any;
    constructor(endpoints: Endpoints, redisClient: Redis.RedisClient, socketServer: SocketIO.Server);
    newMessage(msg: string | API.MessageData, socket?: SocketIO.Socket): Promise<boolean>;
    protected _initializeClient(socket?: SocketIO.Socket): Promise<boolean>;
}
