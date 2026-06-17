import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClientDto {
    @ApiPropertyOptional({ example: 'João Silva' })
    name?: string;

    @ApiPropertyOptional({ enum: ['PREPAID', 'POSPAID'] })
    planType?: string;

    @ApiPropertyOptional({
        enum: ['balance', 'deactivate'],
        description: 'balance: adiciona saldo; deactivate: desativa a conta',
    })
    action?: string;

    @ApiPropertyOptional({
        example: 1000,
        description: 'Valor em centavos, obrigatório quando action=balance',
    })
    value?: number;
}
