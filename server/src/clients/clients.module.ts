import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ClientsService } from './clients.service';

@Module({
    providers: [ClientsService, PrismaService],
    exports: [ClientsService],
})
export class ClientsModule { }
