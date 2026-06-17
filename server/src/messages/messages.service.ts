import { Injectable, UnprocessableEntityException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Message, Priority, MessageStatus, Plan, TransactionType, MessageType } from '@prisma/client';
import { QueueService } from 'src/queue/queue.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MessagesService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => QueueService)) private queueService: QueueService,
        private eventsGateway: EventsGateway,
    ) { }

    async sendMessage(
        document: string,
        type: string,
        conversationId: number | null | undefined,
        senderId: number,
        recipientId: number,
        content: string,
        priority: string,
        timestamp: Date
    ): Promise<Message | null> {
        const message = await this.prisma.$transaction(async (tx) => {
            let convId = conversationId
            if (!convId) {
                let conv = await tx.conversation.findFirst({
                    where: {
                        OR: [
                            { clientId: senderId, recipientId },
                            { clientId: recipientId, recipientId: senderId },
                        ]
                    }
                })
                if (!conv) {
                    const recipient = await tx.client.findUniqueOrThrow({ where: { id: recipientId } })
                    conv = await tx.conversation.create({
                        data: {
                            clientId: senderId,
                            recipientId,
                            recipientName: recipient.name,
                        }
                    })
                }
                convId = conv.id
            }

            const client = await tx.client.findUniqueOrThrow({
                where: { documentId: document }
            })
            let cost = priority == 'NORMAL' ? 25 : priority == 'URGENT' ? 50 : 0;
            if (client.balance < cost) {
                throw new UnprocessableEntityException('Saldo restante inferior ao custo da mensagem.');
            }
            let balance = client.balance - cost;
            await tx.client.update({
                data: { balance },
                where: { id: client.id }
            });
            const message = await tx.message.create({
                data: {
                    type: type.toUpperCase() as MessageType,
                    conversationId: convId,
                    senderId: senderId,
                    recipientId: recipientId,
                    content: content,
                    priority: priority.toUpperCase() as Priority,
                    timestamp: timestamp,
                    cost: cost,
                    status: MessageStatus.QUEUED,
                }
            })
            await tx.transaction.create({
                data: {
                    clientId: client.id,
                    value: cost,
                    type: TransactionType.DEBIT,
                    description: `Débito por envio de mensagem ${priority} - ${cost}`,
                    timestamp: timestamp,
                    messageId: message.id,
                }
            });
            return message;
        });
        this.queueService.push(message.priority, message.id);
        return message;
    }

    async getMessages(): Promise<Message[] | null> {
        return await this.prisma.message.findMany({
            where: {}
        });
    }

    async getMessagePerId(id: number): Promise<Message | null> {
        return await this.prisma.message.findUniqueOrThrow({
            where: { id: id }
        });
    }

    async getStatus(id: number): Promise<{ status: MessageStatus } | undefined> {
        return await this.prisma.message.findUniqueOrThrow({
            where: { id: id },
            select: { status: true },
        });
    }

    async changeStatus(id: number, status: MessageStatus) {
        return await this.prisma.message.update({
            where: { id },
            data: { status },
            include: {
                sender: { select: { documentId: true } },
                recipient: { select: { documentId: true } },
            },
        });
    }

    async markAsDelivered(messageId: number): Promise<void> {
        const message = await this.prisma.message.findUniqueOrThrow({
            where: { id: messageId },
            include: { sender: { select: { documentId: true } } },
        });

        if (message.status !== MessageStatus.SENT) return;

        await this.prisma.message.update({
            where: { id: messageId },
            data: { status: MessageStatus.DELIVERED },
        });

        this.eventsGateway.emitToDocument(message.sender.documentId, 'message:status', {
            id: message.id,
            conversationId: message.conversationId,
            status: MessageStatus.DELIVERED,
        });
    }

    async markConversationAsRead(document: string, conversationId: number): Promise<void> {
        const client = await this.prisma.client.findUniqueOrThrow({
            where: { documentId: document },
        });

        const messages = await this.prisma.message.findMany({
            where: {
                conversationId,
                recipientId: client.id,
                status: MessageStatus.DELIVERED,
            },
            include: {
                sender: { select: { documentId: true } },
            },
        });

        if (!messages.length) return;

        await Promise.all(
            messages.map(async (msg) => {
                await this.prisma.message.update({
                    where: { id: msg.id },
                    data: { status: MessageStatus.READ },
                });
                this.eventsGateway.emitToDocument(msg.sender.documentId, 'message:status', {
                    id: msg.id,
                    conversationId: msg.conversationId,
                    status: MessageStatus.READ,
                });
            })
        );
    }
}
