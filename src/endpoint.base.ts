/*
    MIT License

    Copyright (c) 2018 MuddyTummy Software LLC
*/

import { EventEmitter } from 'events';
import * as SocketIO from 'socket.io';

import { RedisAPI } from './client.redis';

const debug = require('debug')('pxt-cloud:endpoint');

export class Endpoint extends EventEmitter {
    public static connectId(socket?: SocketIO.Socket) {
        return socket ? socket.id : '';
    }

    private _io: SocketIO.Namespace | null = null;
    private _redisAPI: RedisAPI;

    protected get io(): SocketIO.Namespace | null {
        return this._io;
    }

    public get redisAPI(): RedisAPI {
        return this._redisAPI;
    }

    constructor(server: any, redisAPI: RedisAPI, nsp?: string) {
        super();

        if ('httpServer' in server) {
            server = server.httpServer;
        }

        this._redisAPI = redisAPI;

        this._attach(SocketIO(server).of(`/${nsp || ''}`));
    }

    protected _attach(io: SocketIO.Namespace) {
        this._io = io;

        io.on('connection', (socket: SocketIO.Socket) => {
            debug(`${io.name} client connected from ${socket.handshake.address}`);

            this._onConnection(socket);

            socket.on('disconnect', (reason) => {
                debug(`${io.name} client disconnected from ${socket.handshake.address}`);

                this._onDisconnection(socket);
            });
        });
    }

    protected _onConnection(socket: SocketIO.Socket) {
        /* do nothing */
    }

    protected _onDisconnection(socket: SocketIO.Socket) {
        /* do nothing */
    }
}
