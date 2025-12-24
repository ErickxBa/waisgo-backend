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
import { UsersService } from './users.service';
import { Public } from '../common/Decorators/public.decorator';
import { UpdateProfileDto } from './Dto/update-profile.dto';
import { User } from '../common/Decorators/user.decorator';
import { Roles } from '../common/Decorators/roles.decorator';
import { RolUsuarioEnum } from './Enums/users-roles.enum';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { UpdatePasswordDto } from './Dto/update-password.dto';

@Controller('users')
export class UsersController {
  private readonly uuidPipe = new ParseUUIDPipe({ version: '4' });

  constructor(private readonly usersService: UsersService) {}

  private async validateUserId(userId: string): Promise<string> {
    return this.uuidPipe.transform(userId, { type: 'custom' });
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    return this.usersService.register(dto);
  }

  @Roles(RolUsuarioEnum.PASAJERO)
  @Patch('profile')
  @HttpCode(HttpStatus.OK)
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
