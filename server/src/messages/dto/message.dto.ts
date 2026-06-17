import { ApiProperty } from '@nestjs/swagger';

export class MessageDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ enum: ['SMS', 'WHATS'] })
    type: string;

    @ApiProperty({ example: 1 })
    conversationId: number;

    @ApiProperty({ example: 1 })
    senderId: number;

    @ApiProperty({ example: 2 })
    recipientId: number;

    @ApiProperty({ example: 'Olá, tudo bem?' })
    content: string;

    @ApiProperty({ example: '2024-01-01T12:00:00.000Z' })
    timestamp: Date;

    @ApiProperty({ enum: ['NORMAL', 'URGENT'] })
    priority: string;

    @ApiProperty({ enum: ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] })
    status: string;

    @ApiProperty({ example: 50 })
    cost: number;
}
