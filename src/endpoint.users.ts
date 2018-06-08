
/*
    MIT License

    Copyright (c) 2018 MuddyTummy Software LLC
*/

import * as SocketIO from 'socket.io';

import { AckCallback, ackHandler } from './api.base';
import { UserData, UsersAPI } from './api.users';
import { RedisAPI } from './client.redis';
import { Endpoint } from './endpoint.base';
import { SocketServerAPI } from './socket.server';

export { UsersAPI } from './api.users';

const debug = require('debug')('pxt-cloud:endpoint.users');

// tslint:disable-next-line:variable-name
const UsersDBKeys = {
    user: (sockid: string) => `user:${sockid}`,
};

export class UsersEndpoint extends Endpoint implements UsersAPI {
    constructor(socketServerAPI: SocketServerAPI, redisAPI: RedisAPI) {
        super(socketServerAPI, redisAPI, 'pxt-cloud.users');
    }

    public selfInfo(cb?: AckCallback<UserData>, socket?: SocketIO.Socket): boolean {
        const userId = Endpoint.userId(socket);
        const userkey = UsersDBKeys.user(userId);

        return this.redisAPI.hgetall(userkey, ackHandler<{ [key: string]: string }, UserData>(cb, reply => {
            return { /* sanitize data */
                name: reply && reply.name ? reply.name : '',
            };
        }));
    }

    public addSelf(user: UserData, cb?: AckCallback<boolean>, socket?: SocketIO.Socket): boolean {
        const userId = Endpoint.userId(socket);
        const userkey = UsersDBKeys.user(userId);

        const multi = this.redisAPI.multi()
            .exists(userkey)
            .hmset(userkey, { /* sanitize data */
                name: user.name || '',
            });

        return multi.exec(ackHandler<any[], boolean>(cb, reply => {
            const existed = !!reply && reply[0]; /* reply from exists */

            if (!existed) {
                this._broadcastEvent('user joined', userId, user, socket);
            }

            return existed;
        }));
    }

    public removeSelf(cb?: AckCallback<boolean>, socket?: SocketIO.Socket): boolean {
        const userId = Endpoint.userId(socket);
        const userkey = UsersDBKeys.user(userId);

        return this.redisAPI.del(userkey, ackHandler<number, boolean>(cb, reply => {
            const existed = !!reply && 1 === reply[0]; /* reply from del */

            if (existed) {
                this._broadcastEvent('user left', userId, socket);
            }

            return existed;
        }));
    }

    protected _onClientConnect(socket: SocketIO.Socket) {
        super._onClientConnect(socket);

        socket.on('self info', (cb?: AckCallback<UserData>) => this.selfInfo(cb, socket));
        socket.on('add self', (user: UserData, cb?: AckCallback<boolean>) => this.addSelf(user, cb, socket));
        socket.on('remove self', (cb?: AckCallback<boolean>) => this.removeSelf(cb, socket));
    }
}
