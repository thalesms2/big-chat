import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageDto } from 'src/messages/dto/message.dto';

export class ConversationDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 1 })
    clientId: number;

    @ApiProperty({ example: 2 })
    recipientId: number;

    @ApiProperty({ example: 'Maria Souza' })
    recipientName: string;

    @ApiPropertyOptional({ example: 'Olá!' })
    lastMessageContent?: string;

    @ApiPropertyOptional({ example: '2024-01-01T12:00:00.000Z' })
    lastMessageTime?: Date;

    @ApiProperty({ example: 0 })
    unreadCount: number;
}

export class ConversationWithMessagesDto extends ConversationDto {
    @ApiProperty({ type: [MessageDto] })
    messages: MessageDto[];
}
