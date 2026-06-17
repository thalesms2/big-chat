import {
    Controller,
    HttpCode,
    HttpStatus,
    Get,
    Param,
    Request
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ConversationsService } from './conversations.service';
import { ClientWithConversationsDto } from './dto/client-with-conversations.dto';
import { ConversationDto, ConversationWithMessagesDto } from './dto/conversation.dto';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) { }

    @HttpCode(HttpStatus.OK)
    @Get()
    @ApiOperation({ summary: 'Listar conversas do cliente autenticado' })
    @ApiResponse({ status: 200, description: 'Cliente com suas conversas (próprias e abertas)', type: ClientWithConversationsDto })
    findAll(@Request() req) {
        return this.conversationsService.findAll(req.client);
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id')
    @ApiOperation({ summary: 'Buscar conversa por ID' })
    @ApiParam({ name: 'id', description: 'ID da conversa', example: 1 })
    @ApiResponse({ status: 200, description: 'Conversa encontrada', type: ConversationDto })
    @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
    findById(@Param() params: { id: string }) {
        return this.conversationsService.findById(Number(params.id));
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id/messages')
    @ApiOperation({ summary: 'Listar mensagens de uma conversa' })
    @ApiParam({ name: 'id', description: 'ID da conversa', example: 1 })
    @ApiResponse({ status: 200, description: 'Conversa com todas as mensagens', type: ConversationWithMessagesDto })
    @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
    getMessages(@Request() req, @Param() params: { id: string }) {
        return this.conversationsService.getMessages(req.client, Number(params.id));
    }
}
