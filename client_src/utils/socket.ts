import { io, Socket } from 'socket.io-client';
import msgpack from 'socket.io-msgpack-parser';

declare const TORN_GAMESERVER_URL: string;

const socket: Socket = io(TORN_GAMESERVER_URL, {
    autoConnect: false
    // parser: msgpack
});

export default socket;
