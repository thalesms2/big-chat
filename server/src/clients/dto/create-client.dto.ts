import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
    @ApiProperty({ example: 'João Silva' })
    name: string;

    @ApiProperty({ example: '12345678900', description: 'Número do documento (CPF ou CNPJ)' })
    document: string;

    @ApiProperty({ enum: ['CPF', 'CNPJ'], example: 'CPF' })
    documentType: string;

    @ApiProperty({ enum: ['PREPAID', 'POSPAID'], example: 'PREPAID' })
    planType: string;
}
