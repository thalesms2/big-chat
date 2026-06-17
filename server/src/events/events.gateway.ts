import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly documentToSocketId = new Map<string, string>();

    constructor(private readonly jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth?.token as string | undefined;
        try {
            const payload = await this.jwtService.verifyAsync(token!);
            client.data.document = payload.document as string;
            this.documentToSocketId.set(payload.document as string, client.id);
        } catch {
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const document = client.data?.document as string | undefined;
        if (document && this.documentToSocketId.get(document) === client.id) {
            this.documentToSocketId.delete(document);
        }
    }

    emitToDocument(document: string, event: string, data: unknown) {
        const socketId = this.documentToSocketId.get(document);
        if (socketId) {
            this.server.to(socketId).emit(event, data);
        }
    }
}
