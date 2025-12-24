import { RegisterUserDto } from './Dto/register-user.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Public } from '../common/Decorators/public.decorator';
import { UpdateProfileDto } from './Dto/update-profile.dto';
import { User } from '../common/Decorators/user.decorator';
import { Roles } from '../common/Decorators/roles.decorator';
import { RolUsuarioEnum } from './Enums/users-roles.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { UpdatePasswordDto } from './Dto/update-password.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  private readonly uuidPipe = new ParseUUIDPipe({ version: '4' });

  constructor(private readonly usersService: UsersService) {}

  private async validateUserId(userId: string): Promise<string> {
    return this.uuidPipe.transform(userId, { type: 'custom' });
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description:
      'Usuario registrado exitosamente. Se enviará un correo de verificación.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o correo ya registrado.',
  })
  async register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Actualizar perfil del usuario verificado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil actualizado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario no verificado o datos inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Solo usuarios con rol PASAJERO.',
  })
  async updateProfile(@User() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const safeUserId = await this.validateUserId(user.id);
    return await this.usersService.updateProfile(safeUserId, dto);
  }

  @Roles(
    RolUsuarioEnum.PASAJERO,
    RolUsuarioEnum.ADMIN,
    RolUsuarioEnum.CONDUCTOR,
  )
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cambiar contraseña del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description:
      'Contraseña actualizada correctamente. Todas las sesiones anteriores serán revocadas.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Contraseña actual incorrecta o la nueva contraseña no cumple los requisitos.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado para su rol.',
  })
  async changePassword(
    @User() user: JwtPayload,
    @Body() dto: UpdatePasswordDto,
  ) {
    const safeUserId = await this.validateUserId(user.id);

    return this.usersService.changePassword(
      safeUserId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
