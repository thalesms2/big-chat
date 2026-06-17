import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsModule } from './clients/clients.module';
import { ConversationsController } from './conversations/conversations.controller';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { QueueModule } from './queue/queue.module';
import { MessagesController } from './messages/messages.controller';
import { QueueController } from './queue/queue.controller';
import { EventsModule } from './events/events.module';

@Module({
    imports: [AuthModule, ClientsModule, ConversationsModule, MessagesModule, QueueModule, EventsModule],
    controllers: [ClientsController, ConversationsController, MessagesController, QueueController],
})
export class AppModule { }
