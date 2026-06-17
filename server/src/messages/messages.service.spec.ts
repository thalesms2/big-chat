import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { MessageStatus, MessageType, Priority } from '@prisma/client';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { QueueService } from '../queue/queue.service';

const txMock = {
    conversation: {
        findFirst: jest.fn(),
        create: jest.fn(),
    },
    client: {
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
    },
    message: {
        create: jest.fn(),
    },
    transaction: {
        create: jest.fn(),
    },
};

const mockPrisma = {
    $transaction: jest.fn().mockImplementation(async (fn) => fn(txMock)),
    message: {
        findMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
    },
    client: {
        findUniqueOrThrow: jest.fn(),
    },
};

const mockEventsGateway = {
    emitToDocument: jest.fn(),
};

const mockQueueService = {
    push: jest.fn(),
};

describe('MessagesService', () => {
    let service: MessagesService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: EventsGateway, useValue: mockEventsGateway },
                { provide: QueueService, useValue: mockQueueService },
            ],
        }).compile();

        service = module.get<MessagesService>(MessagesService);
    });

    describe('sendMessage', () => {
        const createdMessage = {
            id: 1,
            type: MessageType.WHATS,
            conversationId: 5,
            senderId: 1,
            recipientId: 2,
            content: 'olá',
            priority: Priority.NORMAL,
            status: MessageStatus.QUEUED,
            timestamp: new Date(),
        };

        beforeEach(() => {
            txMock.client.findUniqueOrThrow.mockResolvedValue({ id: 10, balance: 500 });
            txMock.message.create.mockResolvedValue(createdMessage);
        });

        it('should use provided conversationId without querying conversations', async () => {
            const result = await service.sendMessage(
                'doc', 'WHATS', 5, 1, 2, 'olá', 'NORMAL', new Date(),
            );

            expect(txMock.conversation.findFirst).not.toHaveBeenCalled();
            expect(txMock.conversation.create).not.toHaveBeenCalled();
            expect(result).toEqual(createdMessage);
        });

        it('should find existing conversation when conversationId is not provided', async () => {
            txMock.conversation.findFirst.mockResolvedValue({ id: 3 });
            txMock.message.create.mockResolvedValue({ ...createdMessage, conversationId: 3 });

            await service.sendMessage('doc', 'WHATS', null, 1, 2, 'olá', 'NORMAL', new Date());

            expect(txMock.conversation.findFirst).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { clientId: 1, recipientId: 2 },
                        { clientId: 2, recipientId: 1 },
                    ],
                },
            });
            expect(txMock.conversation.create).not.toHaveBeenCalled();
        });

        it('should create new conversation when none exists', async () => {
            txMock.conversation.findFirst.mockResolvedValue(null);
            txMock.client.findUniqueOrThrow
                .mockResolvedValueOnce({ id: 2, name: 'Destinatário' })
                .mockResolvedValueOnce({ id: 10, balance: 500 });
            txMock.conversation.create.mockResolvedValue({ id: 99 });
            txMock.message.create.mockResolvedValue({ ...createdMessage, conversationId: 99 });

            await service.sendMessage('doc', 'WHATS', undefined, 1, 2, 'olá', 'NORMAL', new Date());

            expect(txMock.conversation.create).toHaveBeenCalledWith({
                data: {
                    clientId: 1,
                    recipientId: 2,
                    recipientName: 'Destinatário',
                },
            });
        });

        it('should create the message with QUEUED status', async () => {
            await service.sendMessage('doc', 'WHATS', 5, 1, 2, 'olá', 'NORMAL', new Date());

            expect(txMock.message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        status: MessageStatus.QUEUED,
                        conversationId: 5,
                        senderId: 1,
                        recipientId: 2,
                        content: 'olá',
                    }),
                }),
            );
        });

        it('should uppercase type and priority', async () => {
            txMock.message.create.mockResolvedValue({ ...createdMessage, type: MessageType.SMS, priority: Priority.URGENT });

            await service.sendMessage('doc', 'sms', 5, 1, 2, 'olá', 'urgent', new Date());

            expect(txMock.message.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        type: MessageType.SMS,
                        priority: Priority.URGENT,
                    }),
                }),
            );
        });

        it('should throw UnprocessableEntityException when balance is insufficient', async () => {
            txMock.client.findUniqueOrThrow.mockResolvedValue({ id: 10, balance: 5 });

            await expect(
                service.sendMessage('doc', 'WHATS', 5, 1, 2, 'olá', 'NORMAL', new Date()),
            ).rejects.toThrow(UnprocessableEntityException);

            expect(txMock.message.create).not.toHaveBeenCalled();
            expect(mockQueueService.push).not.toHaveBeenCalled();
        });

        it('should push to queue with priority and message id after transaction', async () => {
            await service.sendMessage('doc', 'WHATS', 5, 1, 2, 'olá', 'NORMAL', new Date());

            expect(mockQueueService.push).toHaveBeenCalledWith(Priority.NORMAL, createdMessage.id);
        });
    });

    describe('getMessages', () => {
        it('should return all messages', async () => {
            const messages = [{ id: 1 }, { id: 2 }];
            mockPrisma.message.findMany.mockResolvedValue(messages);

            const result = await service.getMessages();

            expect(mockPrisma.message.findMany).toHaveBeenCalledWith({ where: {} });
            expect(result).toEqual(messages);
        });
    });

    describe('getMessagePerId', () => {
        it('should return message by id', async () => {
            const message = { id: 1, content: 'olá' };
            mockPrisma.message.findUniqueOrThrow.mockResolvedValue(message);

            const result = await service.getMessagePerId(1);

            expect(mockPrisma.message.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 1 } });
            expect(result).toEqual(message);
        });

        it('should propagate error when message not found', async () => {
            mockPrisma.message.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.getMessagePerId(999)).rejects.toThrow('Not found');
        });
    });

    describe('getStatus', () => {
        it('should return the status of a message', async () => {
            mockPrisma.message.findUniqueOrThrow.mockResolvedValue({ status: MessageStatus.SENT });

            const result = await service.getStatus(1);

            expect(mockPrisma.message.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: 1 },
                select: { status: true },
            });
            expect(result).toEqual({ status: MessageStatus.SENT });
        });
    });

    describe('changeStatus', () => {
        it('should update status and return message with sender and recipient documents', async () => {
            const updated = {
                id: 1,
                status: MessageStatus.DELIVERED,
                sender: { documentId: 'sender-doc' },
                recipient: { documentId: 'recipient-doc' },
            };
            mockPrisma.message.update.mockResolvedValue(updated);

            const result = await service.changeStatus(1, MessageStatus.DELIVERED);

            expect(mockPrisma.message.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: { status: MessageStatus.DELIVERED },
                include: {
                    sender: { select: { documentId: true } },
                    recipient: { select: { documentId: true } },
                },
            });
            expect(result).toEqual(updated);
        });
    });

    describe('markAsDelivered', () => {
        it('should update SENT message to DELIVERED and emit to sender', async () => {
            const message = { id: 5, conversationId: 2, status: MessageStatus.SENT, sender: { documentId: 'sender-doc' } };
            mockPrisma.message.findUniqueOrThrow.mockResolvedValue(message);
            mockPrisma.message.update.mockResolvedValue({});

            await service.markAsDelivered(5);

            expect(mockPrisma.message.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { status: MessageStatus.DELIVERED },
            });
            expect(mockEventsGateway.emitToDocument).toHaveBeenCalledWith('sender-doc', 'message:status', {
                id: 5,
                conversationId: 2,
                status: MessageStatus.DELIVERED,
            });
        });

        it('should do nothing when message is not in SENT status', async () => {
            mockPrisma.message.findUniqueOrThrow.mockResolvedValue({
                id: 5, conversationId: 2, status: MessageStatus.DELIVERED, sender: { documentId: 'sender-doc' },
            });

            await service.markAsDelivered(5);

            expect(mockPrisma.message.update).not.toHaveBeenCalled();
            expect(mockEventsGateway.emitToDocument).not.toHaveBeenCalled();
        });

        it('should propagate error when message not found', async () => {
            mockPrisma.message.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.markAsDelivered(999)).rejects.toThrow('Not found');
        });
    });

    describe('markConversationAsRead', () => {
        it('should return early without any updates when no DELIVERED messages exist', async () => {
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue({ id: 5 });
            mockPrisma.message.findMany.mockResolvedValue([]);

            await service.markConversationAsRead('doc-123', 1);

            expect(mockPrisma.message.update).not.toHaveBeenCalled();
            expect(mockEventsGateway.emitToDocument).not.toHaveBeenCalled();
        });

        it('should query DELIVERED messages where the client is recipient', async () => {
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue({ id: 5 });
            mockPrisma.message.findMany.mockResolvedValue([]);

            await service.markConversationAsRead('doc-123', 3);

            expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
                where: {
                    conversationId: 3,
                    recipientId: 5,
                    status: MessageStatus.DELIVERED,
                },
                include: {
                    sender: { select: { documentId: true } },
                },
            });
        });

        it('should update each DELIVERED message to READ', async () => {
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue({ id: 5 });
            mockPrisma.message.findMany.mockResolvedValue([
                { id: 10, conversationId: 1, sender: { documentId: 'sender-doc' } },
                { id: 11, conversationId: 1, sender: { documentId: 'sender-doc' } },
            ]);
            mockPrisma.message.update.mockResolvedValue({});

            await service.markConversationAsRead('doc-123', 1);

            expect(mockPrisma.message.update).toHaveBeenCalledTimes(2);
            expect(mockPrisma.message.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { status: MessageStatus.READ },
            });
            expect(mockPrisma.message.update).toHaveBeenCalledWith({
                where: { id: 11 },
                data: { status: MessageStatus.READ },
            });
        });

        it('should emit message:status READ to each message sender', async () => {
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue({ id: 5 });
            mockPrisma.message.findMany.mockResolvedValue([
                { id: 10, conversationId: 1, sender: { documentId: 'sender-a' } },
                { id: 11, conversationId: 1, sender: { documentId: 'sender-b' } },
            ]);
            mockPrisma.message.update.mockResolvedValue({});

            await service.markConversationAsRead('doc-123', 1);

            expect(mockEventsGateway.emitToDocument).toHaveBeenCalledTimes(2);
            expect(mockEventsGateway.emitToDocument).toHaveBeenCalledWith('sender-a', 'message:status', {
                id: 10,
                conversationId: 1,
                status: MessageStatus.READ,
            });
            expect(mockEventsGateway.emitToDocument).toHaveBeenCalledWith('sender-b', 'message:status', {
                id: 11,
                conversationId: 1,
                status: MessageStatus.READ,
            });
        });
    });
});
