import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Client, Conversation, MessageStatus } from '@prisma/client';

@Injectable()
export class ConversationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(document: string): Promise<Client | null> {
        return await this.prisma.client.findUniqueOrThrow({
            where: { documentId: document },
            include: {
                ownChats: {
                    include: {
                        messages: true
                    }
                },
                openChats: {
                    include: {
                        messages: true
                    }
                }
            },
        });
    }
    async findById(id: number): Promise<Conversation | null> {
        return await this.prisma.conversation.findUniqueOrThrow({
            where: { id: id }
        });
    }

    async getMessages(documentId: string, id: number): Promise<Conversation | null> {
        const client = await this.prisma.client.findFirstOrThrow({
            where: { documentId }
        });

        await this.prisma.message.updateMany({
            where: { conversationId: id, recipientId: client.id, status: MessageStatus.SENT },
            data: { status: MessageStatus.DELIVERED },
        });

        return await this.prisma.conversation.findFirstOrThrow({
            where: { id: id },
            include: {
                messages: true
            }
        });
    }
}
