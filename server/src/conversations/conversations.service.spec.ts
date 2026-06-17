import { Test, TestingModule } from '@nestjs/testing';
import { MessageStatus } from '@prisma/client';
import { ConversationsService } from './conversations.service';
import { PrismaService } from '../prisma.service';

const mockPrisma = {
    client: {
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
    },
    conversation: {
        findUniqueOrThrow: jest.fn(),
        findFirstOrThrow: jest.fn(),
    },
    message: {
        updateMany: jest.fn(),
    },
};

describe('ConversationsService', () => {
    let service: ConversationsService;

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<ConversationsService>(ConversationsService);
    });

    describe('findAll', () => {
        it('should return client with ownChats and openChats included', async () => {
            const clientData = {
                id: 1,
                documentId: 'doc-123',
                ownChats: [{ id: 10, messages: [] }],
                openChats: [{ id: 20, messages: [] }],
            };
            mockPrisma.client.findUniqueOrThrow.mockResolvedValue(clientData);

            const result = await service.findAll('doc-123');

            expect(mockPrisma.client.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
                include: {
                    ownChats: { include: { messages: true } },
                    openChats: { include: { messages: true } },
                },
            });
            expect(result).toEqual(clientData);
        });

        it('should propagate error when client not found', async () => {
            mockPrisma.client.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.findAll('unknown')).rejects.toThrow('Not found');
        });
    });

    describe('findById', () => {
        it('should return conversation by id', async () => {
            const conversation = { id: 5, clientId: 1, recipientId: 2 };
            mockPrisma.conversation.findUniqueOrThrow.mockResolvedValue(conversation);

            const result = await service.findById(5);

            expect(mockPrisma.conversation.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { id: 5 },
            });
            expect(result).toEqual(conversation);
        });

        it('should propagate error when conversation not found', async () => {
            mockPrisma.conversation.findUniqueOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.findById(999)).rejects.toThrow('Not found');
        });
    });

    describe('getMessages', () => {
        it('should return conversation with messages after updating statuses', async () => {
            const conversation = { id: 5, messages: [{ id: 1, content: 'oi', status: 'DELIVERED' }] };
            const client = { id: 10 };
            mockPrisma.client.findFirstOrThrow.mockResolvedValue(client);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 1 });
            mockPrisma.conversation.findFirstOrThrow.mockResolvedValue(conversation);

            const result = await service.getMessages('doc-123', 5);

            expect(mockPrisma.conversation.findFirstOrThrow).toHaveBeenCalledWith({
                where: { id: 5 },
                include: { messages: true },
            });
            expect(result).toEqual(conversation);
        });

        it('should look up the authenticated client by documentId', async () => {
            const client = { id: 10 };
            mockPrisma.client.findFirstOrThrow.mockResolvedValue(client);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.conversation.findFirstOrThrow.mockResolvedValue({ id: 5, messages: [] });

            await service.getMessages('doc-123', 5);

            expect(mockPrisma.client.findFirstOrThrow).toHaveBeenCalledWith({
                where: { documentId: 'doc-123' },
            });
        });

        it('should mark received messages as DELIVERED', async () => {
            const client = { id: 10 };
            mockPrisma.client.findFirstOrThrow.mockResolvedValue(client);
            mockPrisma.message.updateMany.mockResolvedValue({ count: 2 });
            mockPrisma.conversation.findFirstOrThrow.mockResolvedValue({ id: 5, messages: [] });

            await service.getMessages('doc-123', 5);

            expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
                where: { conversationId: 5, recipientId: 10, status: MessageStatus.SENT },
                data: { status: MessageStatus.DELIVERED },
            });
        });

        it('should propagate error when client not found', async () => {
            mockPrisma.client.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.getMessages('doc-123', 999)).rejects.toThrow('Not found');
        });

        it('should propagate error when conversation not found', async () => {
            mockPrisma.client.findFirstOrThrow.mockResolvedValue({ id: 10 });
            mockPrisma.message.updateMany.mockResolvedValue({ count: 0 });
            mockPrisma.conversation.findFirstOrThrow.mockRejectedValue(new Error('Not found'));

            await expect(service.getMessages('doc-123', 999)).rejects.toThrow('Not found');
        });
    });
});
