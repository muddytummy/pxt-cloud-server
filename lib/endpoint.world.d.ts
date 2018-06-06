/// <reference types="socket.io" />
import { Callback, UserData, WorldAPI } from './api.world';
import { Endpoint } from './endpoint.base';
export declare const keys: {
    user: (sockid: string) => string;
};
export declare class WorldEndpoint extends Endpoint implements WorldAPI {
    constructor(server: any);
    addUser(user: UserData, cb?: Callback<boolean>, socket?: SocketIO.Socket): boolean;
    removeUser(cb?: Callback<boolean>, socket?: SocketIO.Socket): boolean;
    protected _onConnection(socket: SocketIO.Socket): void;
}
