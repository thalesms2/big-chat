import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { MessagesModule } from '../messages/messages.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [forwardRef(() => MessagesModule), EventsModule],
    providers: [QueueService],
    exports: [QueueService],
})
export class QueueModule { }
