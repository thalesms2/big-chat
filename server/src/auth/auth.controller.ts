import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '../public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post()
    @ApiOperation({ summary: 'Autenticar cliente', description: 'Retorna um JWT para uso nas demais rotas' })
    @ApiBody({ type: SignInDto })
    @ApiResponse({ status: 200, description: 'Autenticado com sucesso', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Documento não encontrado' })
    signIn(@Body() signInDto: SignInDto) {
        return this.authService.signIn(signInDto.document);
    }
}
