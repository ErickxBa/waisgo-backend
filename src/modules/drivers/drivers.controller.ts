import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { User } from '../common/Decorators/user.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { JweAuthGuard } from '../auth/Guards/jwe-auth.guard';
import { Roles } from '../common/Decorators/roles.decorator';
import { RolUsuarioEnum } from '../auth/Enum/users-roles.enum';

@ApiTags('Drivers')
@Controller('drivers')
@UseGuards(JweAuthGuard)
@ApiBearerAuth()
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del conductor autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del conductor' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@User() user: JwtPayload) {
    return this.driversService.getProfile(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener información de un conductor' })
  @ApiResponse({ status: 200, description: 'Información del conductor' })
  @ApiResponse({ status: 404, description: 'Conductor no encontrado' })
  async getDriver(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.driversService.getDriverById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Actualizar perfil del conductor' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updateProfile(
    @User() user: JwtPayload,
    @Body() updateData: Record<string, any>,
  ) {
    return this.driversService.updateProfile(user.sub, updateData);
  }

  @Post('request')
  @ApiOperation({ summary: 'Solicitud para ser conductor' })
  @ApiResponse({ status: 201, description: 'Solicitud creada' })
  async createDriverRequest(
    @User() user: JwtPayload,
    @Body() data: Record<string, any>,
  ) {
    return this.driversService.createDriverRequest(user.sub, data);
  }

  @Get('trips/history')
  @ApiOperation({ summary: 'Historial de viajes del conductor' })
  @ApiResponse({ status: 200, description: 'Historial de viajes' })
  async getTripHistory(
    @User() user: JwtPayload,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.driversService.getTripHistory(user.sub, limit, offset);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas del conductor' })
  @ApiResponse({ status: 200, description: 'Estadísticas' })
  async getStats(@User() user: JwtPayload) {
    return this.driversService.getStats(user.sub);
  }

  @Get('availability')
  @ApiOperation({ summary: 'Obtener disponibilidad del conductor' })
  @ApiResponse({ status: 200, description: 'Estado de disponibilidad' })
  async getAvailability(@User() user: JwtPayload) {
    return this.driversService.getAvailability(user.sub);
  }

  @Patch('availability')
  @ApiOperation({ summary: 'Actualizar disponibilidad del conductor' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  async updateAvailability(
    @User() user: JwtPayload,
    @Body() data: { isAvailable: boolean },
  ) {
    return this.driversService.updateAvailability(user.sub, data.isAvailable);
  }
}
