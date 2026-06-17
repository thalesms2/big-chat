import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
    @ApiProperty({ example: '12345678900', description: 'CPF ou CNPJ do cliente' })
    document: string;
}
