import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Client, DocumentType, Plan } from '@prisma/client';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) { }

    async create(
        name: string,
        document: string,
        documentType: string,
        planType: string,
    ): Promise<Client | null> {
        return await this.prisma.client.create({
            data: {
                name: name,
                documentId: document,
                documentType: documentType.toUpperCase() as DocumentType,
                planType: planType.toUpperCase() as Plan,
                active: true
            },
        });
    }

    async findOne(document: string): Promise<Client | undefined> {
        return await this.prisma.client.findUniqueOrThrow({
            where: { documentId: document }
        });
    }

    async findById(id: number): Promise<Client> {
        return await this.prisma.client.findUniqueOrThrow({
            where: { id }
        });
    }

    async getBalance(document: string): Promise<string | undefined> {
        const balance = await this.prisma.client.findFirstOrThrow({
            where: { documentId: document },
            select: { balance: true }
        })
        return `R$${(Number(balance) / 100).toFixed(2)}`;
    }

    async update(
        document: string,
        name?: string,
        planType?: string,
        action?: string,
        value?: number
    ): Promise<Client | undefined> {
        let newBalance = 0;
        if (action == 'balance') {
            if (value == undefined) {
                throw new BadRequestException()
            }
            const client = await this.prisma.client.findFirstOrThrow({ where: { documentId: document } });
            newBalance = (client.balance) + value;
        }

        return await this.prisma.client.update({
            where: { documentId: document },
            data: {
                ...(name && { name: name }),
                ...(planType && { planType: planType.toUpperCase() as Plan }),
                ...(action == 'deactivate' && { active: false }),
                ...(action == 'balance' && { balance: newBalance })
            },
        })
    }
}
