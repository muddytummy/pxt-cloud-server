/*
    MIT License

    Copyright (c) 2018 MuddyTummy Software LLC
*/

import { EventEmitter } from 'events';
import * as Redis from 'redis';
import * as SocketIO from 'socket.io';

import * as API from 'pxt-cloud-api';

export type Callback<T> = (error: Error | null, reply?: T) => void;

export abstract class Endpoint extends EventEmitter implements API.CommonAPI {
    public static userId = Endpoint.connectId;

    public static connectId(socket?: SocketIO.Socket) {
        return socket ? socket.client.id : 'localhost';
    }

    protected static _extractSocketFromArgs(args: any[]): [ any[], any ] {
        let socket;

        if (args.length > 0) {
            const _socket = args[args.length - 1];

            if (undefined === _socket || (typeof _socket === 'object' && 'broadcast' in _socket)) {
                socket = _socket;

                args = args.slice(0, -1);
            }
        }

        return [ args, socket ];
    }

    protected static _fulfillReceivedEvent<T>(promise: PromiseLike<T>, cb: Callback<T>) {
        promise.then(value => cb(null, value), cb);
    }

    protected static _defaultPromiseHandler(resolve: any, reject: any) {
        return (error: any) => !error ? resolve() : reject(error);
    }

    protected static _bufferPromiseHandler(resolve: any, reject: any) {
        return (error: any, reply: string | string[]) => {
            if (!error) {
                if (reply) {
                    if (Array.isArray(reply)) {
                        resolve(reply.map(r => Buffer.from(r, 'binary')));
                    } else {
                        resolve(Buffer.from(reply, 'binary'));
                    }
                } else {
                    resolve();
                }
            } else  {
                reject(error);
            }
        };
    }

    public readonly off = super.removeListener;

    protected abstract _debug: any;

    public get isConnected(): boolean {
        return !!this._socketNamespace;
    }

    private _socketNamespace: SocketIO.Namespace | null = null;
    private _endpoints: Endpoints;
    private _redisClient: Redis.RedisClient;

    protected get endpoints() {
        return this._endpoints;
    }

    protected get redisClient() {
        return this._redisClient;
    }

    constructor(
        endpoints: Endpoints,
        redisClient: Redis.RedisClient,
        socketServer: SocketIO.Server,
        nsp?: string,
    ) {
        super();

        const socketNamespace = socketServer.of(`pxt-cloud${nsp ? `/${nsp}` : ''}`);
        this._socketNamespace = socketNamespace;

        this._endpoints = endpoints;
        this._redisClient = redisClient;

        socketNamespace.on('connect', (socket: SocketIO.Socket) => {
            this._debug(`${socket.id} client connected from ${socket.handshake.address}`);
            this._onClientConnect(socket);

            socket.on('disconnect', reason => {
                this._debug(`${socket.id} client disconnected from ${socket.handshake.address} (${reason})`);
                this._onClientDisconnect(socket);
            });
        });

        socketNamespace.on('error', (error: Error) => {
            this._debug(`${error.message}\n`);
        });
    }

    public dispose() {
        this._socketNamespace = null;
    }

    protected _notifyEvent(event: string, ...args: any[]) {
        this.emit(event, ...args);
    }

    protected _notifyAndBroadcastEvent(event: string, ...args_: any[]) {
        const [ args, socket ] = Endpoint._extractSocketFromArgs(args_);

        this._notifyEvent(event, args);

        if (socket) {
            socket.broadcast.emit(event, ...args);
        }
    }

    protected _onClientConnect(socket: SocketIO.Socket) {
        /* do nothing */
    }

    protected _onClientDisconnect(socket: SocketIO.Socket) {
        /* do nothing */
    }
}

export type Endpoints = { [E in keyof API.PublicAPI]: (Endpoint & API.PublicAPI[E]) | null };
