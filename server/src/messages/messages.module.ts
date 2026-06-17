import { Module, forwardRef } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaService } from 'src/prisma.service';
import { QueueModule } from '../queue/queue.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [forwardRef(() => QueueModule), EventsModule],
    providers: [MessagesService, PrismaService],
    exports: [MessagesService],
})
export class MessagesModule { }
