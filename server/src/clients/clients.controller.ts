import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Get,
    Put,
    Param
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiParam,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { Public } from '../public.decorator';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ClientDto } from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
    constructor(private readonly clientsService: ClientsService) { }

    @HttpCode(HttpStatus.OK)
    @Get()
    @ApiOperation({ summary: 'Listar clientes' })
    @ApiResponse({ status: 200, description: 'Retorna true', type: Boolean })
    listClients() {
        return true;
    }

    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post()
    @ApiOperation({ summary: 'Criar cliente' })
    @ApiBody({ type: CreateClientDto })
    @ApiResponse({ status: 201, description: 'Cliente criado', type: ClientDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos' })
    create(@Body() createClientDto: CreateClientDto) {
        return this.clientsService.create(
            createClientDto.name,
            createClientDto.document,
            createClientDto.documentType,
            createClientDto.planType
        );
    }

    @HttpCode(HttpStatus.OK)
    @Get('id/:id')
    @ApiOperation({ summary: 'Buscar cliente por ID numérico' })
    @ApiParam({ name: 'id', description: 'ID numérico do cliente', example: 1 })
    @ApiResponse({ status: 200, description: 'Cliente encontrado', type: ClientDto })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    getById(@Param() params: { id: string }) {
        return this.clientsService.findById(Number(params.id));
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id')
    @ApiOperation({ summary: 'Buscar cliente por documento' })
    @ApiParam({ name: 'id', description: 'CPF ou CNPJ do cliente', example: '123.456.789-00' })
    @ApiResponse({ status: 200, description: 'Cliente encontrado', type: ClientDto })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    getPerId(@Param() params: { id: string }) {
        return this.clientsService.findOne(params.id);
    }

    @HttpCode(HttpStatus.OK)
    @Put(':id')
    @ApiOperation({ summary: 'Atualizar cliente' })
    @ApiParam({ name: 'id', description: 'CPF ou CNPJ do cliente', example: '123.456.789-00' })
    @ApiBody({ type: UpdateClientDto })
    @ApiResponse({ status: 200, description: 'Cliente atualizado', type: ClientDto })
    @ApiResponse({ status: 400, description: 'action=balance requer o campo value' })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    update(@Param() params: { id: string }, @Body() updateClientDto: UpdateClientDto) {
        return this.clientsService.update(
            params.id,
            updateClientDto.name,
            updateClientDto.planType,
            updateClientDto.action,
            updateClientDto.value
        );
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id/balance')
    @ApiOperation({ summary: 'Consultar saldo do cliente' })
    @ApiParam({ name: 'id', description: 'CPF ou CNPJ do cliente', example: '123.456.789-00' })
    @ApiResponse({ status: 200, description: 'Saldo formatado em reais', schema: { type: 'string', example: 'R$100.00' } })
    @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
    getBalance(@Param() params: { id: string }) {
        return this.clientsService.getBalance(params.id);
    }
}
