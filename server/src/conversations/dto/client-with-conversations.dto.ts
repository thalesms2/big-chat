import { ApiProperty } from '@nestjs/swagger';
import { ClientDto } from 'src/clients/dto/client.dto';
import { ConversationWithMessagesDto } from './conversation.dto';

export class ClientWithConversationsDto extends ClientDto {
    @ApiProperty({ type: [ConversationWithMessagesDto] })
    ownChats: ConversationWithMessagesDto[];

    @ApiProperty({ type: [ConversationWithMessagesDto] })
    openChats: ConversationWithMessagesDto[];
}
