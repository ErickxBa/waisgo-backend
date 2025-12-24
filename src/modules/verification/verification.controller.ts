import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VerificationService } from './verification.service';
import { ConfirmOtpDto } from './Dto/confirm-otp.dto';
import { User } from 'src/modules/common/Decorators/user.decorator';
import type { JwtPayload } from 'src/modules/common/types/jwt-payload.type';

@ApiTags('Verification')
@Controller('verification')
export class VerificationController {
  private readonly uuidPipe = new ParseUUIDPipe({ version: '4' });

  constructor(private readonly verificationService: VerificationService) {}

  private async validateUserId(userId: string): Promise<string> {
    return this.uuidPipe.transform(userId, { type: 'custom' });
  }

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Enviar código de verificación por correo' })
  @ApiResponse({
    status: 200,
    description: 'Código de verificación enviado al correo registrado.',
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario ya verificado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Límite de reenvíos alcanzado.',
  })
  async send(@User() user: JwtPayload) {
    if (user.isVerified) {
      throw new BadRequestException('Usuario ya verificado');
    }

    const safeUserId = await this.validateUserId(user.id);
    await this.verificationService.sendVerification(safeUserId);

    return {
      success: true,
      message: 'Código de verificación enviado al correo',
    };
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirmar código de verificación' })
  @ApiResponse({
    status: 200,
    description:
      'Cuenta verificada exitosamente. El usuario ahora tiene rol PASAJERO.',
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario ya verificado, código incorrecto o expirado.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Demasiados intentos fallidos. OTP bloqueado.',
  })
  async confirm(@User() user: JwtPayload, @Body() dto: ConfirmOtpDto) {
    if (user.isVerified) {
      throw new BadRequestException('Usuario ya verificado');
    }

    const safeUserId = await this.validateUserId(user.id);
    await this.verificationService.confirmVerification(safeUserId, dto.code);

    return {
      success: true,
      message: 'Cuenta verificada exitosamente',
    };
  }
}
