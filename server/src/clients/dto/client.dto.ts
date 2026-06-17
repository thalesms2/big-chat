import { ApiProperty } from '@nestjs/swagger';

export class ClientDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'João Silva' })
    name: string;

    @ApiProperty({ example: '12345678900' })
    documentId: string;

    @ApiProperty({ enum: ['CPF', 'CNPJ'] })
    documentType: string;

    @ApiProperty({ enum: ['PREPAID', 'POSPAID'] })
    planType: string;

    @ApiProperty({ example: 10000, description: 'Saldo em centavos' })
    balance: number;

    @ApiProperty({ example: 0, description: 'Limite em centavos' })
    limit: number;

    @ApiProperty({ example: true })
    active: boolean;
}
