import { Injectable, NotFoundException } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private clientsService: ClientsService,
        private jwtService: JwtService
    ) { }

    async signIn(document: string): Promise<{ access_token: string }> {
        const user = await this.clientsService.findOne(document);
        if (user == undefined) {
            throw new NotFoundException();
        }
        const payload = { sub: user.id, document: user.documentId };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }
}
