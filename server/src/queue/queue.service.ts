import { Injectable, OnModuleInit, OnModuleDestroy, Inject, forwardRef } from '@nestjs/common';
import { MessageStatus } from '@prisma/client';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { existsSync } from 'fs';
import { MessagesService } from '../messages/messages.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private worker: Worker;

    constructor(
        @Inject(forwardRef(() => MessagesService)) private readonly messagesService: MessagesService,
        private readonly eventsGateway: EventsGateway,
    ) { }

    onModuleInit() {
        const distPath = join(__dirname, 'queue.worker.js');
        const srcPath = join(process.cwd(), 'src', 'queue', 'queue.worker.js');
        const workerPath = existsSync(distPath) ? distPath : srcPath;
        this.worker = new Worker(workerPath);

        this.worker.on('message', async (data) => {
            console.log(`[NestJS] Mensagem recebida do Worker:`, data);

            for (const status of [MessageStatus.PROCESSING, MessageStatus.SENT]) {
                const updated = await this.messagesService.changeStatus(data.messageId, status);

                this.eventsGateway.emitToDocument(updated.sender.documentId, 'message:status', {
                    id: updated.id,
                    conversationId: updated.conversationId,
                    status: updated.status,
                });

                if (status === MessageStatus.SENT) {
                    this.eventsGateway.emitToDocument(updated.recipient.documentId, 'message:new', updated);
                }
            }
        });

        this.worker.on('error', (err) => {
            console.error(`[NestJS] Erro crítico no Worker:`, err);
        });

        this.worker.on('exit', (code) => {
            console.log(`[NestJS] Worker finalizado com código ${code}`);
        });

        console.log('[NestJS] Worker Thread instanciado com sucesso!');
    }

    push(priority: string, messageId: number) {
        this.worker.postMessage({ action: 'PUSH', priority: priority, payload: messageId });
    }

    pause() {
        this.worker.postMessage({ action: 'PAUSE' });
    }

    resume() {
        this.worker.postMessage({ resume: 'RESUME' });
    }

    onModuleDestroy() {
        if (this.worker) {
            this.worker.terminate();
        }
    }
}
