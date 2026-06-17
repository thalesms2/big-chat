import { ApiProperty } from '@nestjs/swagger';

export class MessageStatusDto {
    @ApiProperty({ enum: ['QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED'] })
    status: string;
}
