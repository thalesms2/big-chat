import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
    @ApiProperty({ enum: ['SMS', 'WHATS'], example: 'SMS' })
    type: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'ID da conversa existente. Omitir para criar nova ou reutilizar conversa com o destinatário.',
    })
    conversationId?: number;

    @ApiProperty({ example: 1 })
    senderId: number;

    @ApiProperty({ example: 2 })
    recipientId: number;

    @ApiProperty({ example: 'Olá, tudo bem?' })
    content: string;

    @ApiProperty({ enum: ['NORMAL', 'URGENT'], example: 'NORMAL' })
    priority: string;

    @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
    timestamp: Date;
}
