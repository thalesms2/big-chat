import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Get,
    Patch,
    Param,
    Request
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiBody,
    ApiParam,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageDto } from './dto/message.dto';
import { MessageStatusDto } from './dto/message-status.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) { }

    @HttpCode(HttpStatus.CREATED)
    @Post()
    @ApiOperation({
        summary: 'Enviar mensagem',
        description: 'Cria e enfileira uma mensagem. Deduz o custo do saldo do remetente.'
    })
    @ApiBody({ type: SendMessageDto })
    @ApiResponse({ status: 201, description: 'Mensagem criada e enfileirada', type: MessageDto })
    @ApiResponse({ status: 422, description: 'Saldo insuficiente para envio' })
    sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
        return this.messagesService.sendMessage(
            req.client,
            sendMessageDto.type,
            sendMessageDto.conversationId,
            sendMessageDto.senderId,
            sendMessageDto.recipientId,
            sendMessageDto.content,
            sendMessageDto.priority,
            sendMessageDto.timestamp,
        );
    }

    @HttpCode(HttpStatus.OK)
    @Get()
    @ApiOperation({ summary: 'Listar todas as mensagens' })
    @ApiResponse({ status: 200, description: 'Lista de mensagens', type: [MessageDto] })
    getMessages() {
        return this.messagesService.getMessages();
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id')
    @ApiOperation({ summary: 'Buscar mensagem por ID' })
    @ApiParam({ name: 'id', description: 'ID da mensagem', example: 1 })
    @ApiResponse({ status: 200, description: 'Mensagem encontrada', type: MessageDto })
    @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
    getMessagePerId(@Param() params: { id: number }) {
        return this.messagesService.getMessagePerId(params.id);
    }

    @HttpCode(HttpStatus.OK)
    @Get(':id/status')
    @ApiOperation({ summary: 'Consultar status de uma mensagem' })
    @ApiParam({ name: 'id', description: 'ID da mensagem', example: 1 })
    @ApiResponse({ status: 200, description: 'Status atual da mensagem', type: MessageStatusDto })
    @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
    getStatus(@Param() params: { id: number }) {
        return this.messagesService.getStatus(params.id);
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch(':id/delivered')
    @ApiOperation({ summary: 'Marcar mensagem como entregue', description: 'Muda status de SENT para DELIVERED e notifica o remetente via WebSocket.' })
    @ApiParam({ name: 'id', description: 'ID da mensagem', example: 1 })
    @ApiResponse({ status: 204, description: 'Mensagem marcada como entregue' })
    markAsDelivered(@Param() params: { id: string }) {
        return this.messagesService.markAsDelivered(Number(params.id));
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Patch('conversation/:id/read')
    @ApiOperation({ summary: 'Marcar mensagens recebidas como lidas', description: 'Marca como READ todas as mensagens DELIVERED recebidas pelo cliente autenticado na conversa e notifica os remetentes via WebSocket.' })
    @ApiParam({ name: 'id', description: 'ID da conversa', example: 1 })
    @ApiResponse({ status: 204, description: 'Mensagens marcadas como lidas' })
    markConversationAsRead(@Request() req, @Param() params: { id: string }) {
        return this.messagesService.markConversationAsRead(req.client, Number(params.id));
    }
}
