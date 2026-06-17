import { Test, TestingModule } from '@nestjs/testing';
import { MessageStatus } from '@prisma/client';
import { QueueService } from './queue.service';
import { MessagesService } from '../messages/messages.service';
import { EventsGateway } from '../events/events.gateway';

let workerMessageHandler: ((data: any) => Promise<void>) | null = null;

const mockWorker = {
    on: jest.fn().mockImplementation((event: string, handler: any) => {
        if (event === 'message') {
            workerMessageHandler = handler;
        }
    }),
    postMessage: jest.fn(),
    terminate: jest.fn(),
};

jest.mock('worker_threads', () => ({
    Worker: jest.fn(() => mockWorker),
}));

jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(false),
}));

describe('QueueService', () => {
    let service: QueueService;
    let messagesService: { changeStatus: jest.Mock };
    let eventsGateway: { emitToDocument: jest.Mock };

    beforeEach(async () => {
        jest.clearAllMocks();
        workerMessageHandler = null;

        mockWorker.on.mockImplementation((event: string, handler: any) => {
            if (event === 'message') {
                workerMessageHandler = handler;
            }
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QueueService,
                {
                    provide: MessagesService,
                    useValue: { changeStatus: jest.fn() },
                },
                {
                    provide: EventsGateway,
                    useValue: { emitToDocument: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<QueueService>(QueueService);
        messagesService = module.get(MessagesService);
        eventsGateway = module.get(EventsGateway);

        await service.onModuleInit();
    });

    afterEach(() => {
        service.onModuleDestroy();
    });

    describe('push', () => {
        it('should post a PUSH action to the worker', () => {
            service.push('NORMAL', 42);

            expect(mockWorker.postMessage).toHaveBeenCalledWith({
                action: 'PUSH',
                priority: 'NORMAL',
                payload: 42,
            });
        });

        it('should forward priority and messageId as-is', () => {
            service.push('URGENT', 99);

            expect(mockWorker.postMessage).toHaveBeenCalledWith({
                action: 'PUSH',
                priority: 'URGENT',
                payload: 99,
            });
        });
    });

    describe('pause', () => {
        it('should post a PAUSE action to the worker', () => {
            service.pause();

            expect(mockWorker.postMessage).toHaveBeenCalledWith({ action: 'PAUSE' });
        });
    });

    describe('resume', () => {
        it('should post a RESUME action to the worker', () => {
            service.resume();

            expect(mockWorker.postMessage).toHaveBeenCalledWith({ resume: 'RESUME' });
        });
    });

    describe('worker message handler', () => {
        const baseMessage = {
            id: 1,
            conversationId: 10,
            sender: { documentId: 'sender-doc' },
            recipient: { documentId: 'recipient-doc' },
        };

        it('should process message through PROCESSING and SENT only', async () => {
            messagesService.changeStatus
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.PROCESSING })
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.SENT });

            await workerMessageHandler!({ messageId: 1 });

            expect(messagesService.changeStatus).toHaveBeenCalledTimes(2);
            expect(messagesService.changeStatus).toHaveBeenNthCalledWith(1, 1, MessageStatus.PROCESSING);
            expect(messagesService.changeStatus).toHaveBeenNthCalledWith(2, 1, MessageStatus.SENT);
        });

        it('should NOT automatically transition to DELIVERED or READ', async () => {
            messagesService.changeStatus
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.PROCESSING })
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.SENT });

            await workerMessageHandler!({ messageId: 1 });

            const calledStatuses = messagesService.changeStatus.mock.calls.map(([, s]) => s);
            expect(calledStatuses).not.toContain(MessageStatus.DELIVERED);
            expect(calledStatuses).not.toContain(MessageStatus.READ);
        });

        it('should emit message:status to sender for each status transition', async () => {
            messagesService.changeStatus
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.PROCESSING })
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.SENT });

            await workerMessageHandler!({ messageId: 1 });

            expect(eventsGateway.emitToDocument).toHaveBeenCalledWith(
                'sender-doc', 'message:status',
                { id: 1, conversationId: 10, status: MessageStatus.PROCESSING },
            );
            expect(eventsGateway.emitToDocument).toHaveBeenCalledWith(
                'sender-doc', 'message:status',
                { id: 1, conversationId: 10, status: MessageStatus.SENT },
            );
        });

        it('should emit message:new to recipient when status is SENT', async () => {
            const sentMessage = { ...baseMessage, status: MessageStatus.SENT };
            messagesService.changeStatus
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.PROCESSING })
                .mockResolvedValueOnce(sentMessage);

            await workerMessageHandler!({ messageId: 1 });

            expect(eventsGateway.emitToDocument).toHaveBeenCalledWith(
                'recipient-doc', 'message:new', sentMessage,
            );
        });

        it('should emit message:new only once, on SENT', async () => {
            messagesService.changeStatus
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.PROCESSING })
                .mockResolvedValueOnce({ ...baseMessage, status: MessageStatus.SENT });

            await workerMessageHandler!({ messageId: 1 });

            const newMessageCalls = (eventsGateway.emitToDocument as jest.Mock).mock.calls.filter(
                ([, event]) => event === 'message:new',
            );
            expect(newMessageCalls).toHaveLength(1);
        });
    });

    describe('onModuleDestroy', () => {
        it('should terminate the worker', () => {
            service.onModuleDestroy();

            expect(mockWorker.terminate).toHaveBeenCalled();
        });
    });
});
