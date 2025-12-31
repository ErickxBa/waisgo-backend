import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles, User } from '../common/Decorators';
import { RolUsuarioEnum } from '../auth/Enum';
import { AdminSeedService } from './admin-seed.service';
import type { JwtPayload, AuthContext } from '../common/types';

@ApiTags('Admin - Seed')
@ApiBearerAuth('access-token')
@Controller('admin/seed')
export class AdminSeedController {
  constructor(private readonly seedService: AdminSeedService) {}

  private getAuthContext(req: Request): AuthContext {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.ip || req.socket?.remoteAddress || 'unknown';

    return {
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  @Roles(RolUsuarioEnum.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 1, ttl: 3600000 } })
  @ApiOperation({ summary: 'Crear datos de prueba en la base de datos' })
  @ApiResponse({ status: 201, description: 'Semilla creada correctamente.' })
  @ApiResponse({ status: 200, description: 'Semilla ya fue ejecutada.' })
  async seed(@User() user: JwtPayload, @Req() req: Request) {
    return this.seedService.seedDatabase(user.id, this.getAuthContext(req));
  }
}
