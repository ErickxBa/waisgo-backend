import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles, User } from '../common/Decorators';
import { RolUsuarioEnum } from '../auth/Enum';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './Dto';
import type { JwtPayload } from '../common/types';

@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  /* ========== PASAJERO / CONDUCTOR ========== */

  /**
   * Crear calificación para una ruta completada
   * - Calificación bidireccional (pasajero → conductor, conductor → pasajero)
   * - Solo hasta 24h después del viaje
   * - Afecta el promedio y puede bloquear si rating < 3.0
   */
  @Roles(RolUsuarioEnum.PASAJERO, RolUsuarioEnum.CONDUCTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear calificación para una ruta completada' })
  @ApiResponse({ status: 201, description: 'Calificación registrada.' })
  @ApiResponse({
    status: 400,
    description: 'Ya calificaste o tiempo expirado.',
  })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada.' })
  async createRating(@User() user: JwtPayload, @Body() dto: CreateRatingDto) {
    // TODO:
    // 1. Validar que la ruta existe y está FINALIZADA o el booking está COMPLETADA
    // 2. Validar que no han pasado más de 24h desde la finalización
    // 3. Validar que no existe ya una calificación de este usuario a ese usuario en esa ruta
    // 4. Validar que el usuario participó en la ruta (como conductor o pasajero)
    // 5. Crear la calificación
    // 6. Actualizar promedio del usuario calificado
    // 7. Si promedio < 3.0, marcar usuario como bloqueado
    return this.ratingsService.createRating(user.sub, dto);
  }

  /**
   * Obtener calificaciones recibidas por el usuario
   */
  @Roles(RolUsuarioEnum.PASAJERO, RolUsuarioEnum.CONDUCTOR)
  @Get('my')
  @ApiOperation({ summary: 'Obtener calificaciones recibidas' })
  @ApiQuery({ name: 'page', required: false, description: 'Número de página' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Resultados por página',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de calificaciones recibidas.',
  })
  async getMyRatings(
    @User() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingsService.getMyRatings(user.sub, page, limit);
  }

  /**
   * Obtener calificaciones dadas por el usuario
   */
  @Roles(RolUsuarioEnum.PASAJERO, RolUsuarioEnum.CONDUCTOR)
  @Get('given')
  @ApiOperation({ summary: 'Obtener calificaciones dadas por el usuario' })
  @ApiResponse({
    status: 200,
    description: 'Listado de calificaciones realizadas.',
  })
  async getRatingsGiven(
    @User() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingsService.getRatingsGiven(user.sub, page, limit);
  }

  /**
   * Obtener resumen de rating del usuario (promedio, total viajes)
   */
  @Roles(RolUsuarioEnum.PASAJERO, RolUsuarioEnum.CONDUCTOR)
  @Get('summary')
  @ApiOperation({ summary: 'Obtener resumen de mi rating' })
  @ApiResponse({ status: 200, description: 'Resumen de rating.' })
  async getRatingSummary(@User() user: JwtPayload) {
    return this.ratingsService.getRatingSummary(user.sub);
  }

  /**
   * Verificar si puedo calificar una ruta específica
   */
  @Roles(RolUsuarioEnum.PASAJERO, RolUsuarioEnum.CONDUCTOR)
  @Get('can-rate/:routeId')
  @ApiOperation({ summary: 'Verificar si puedo calificar una ruta' })
  @ApiParam({ name: 'routeId', description: 'ID de la ruta' })
  @ApiResponse({
    status: 200,
    description: 'Información de si puede calificar.',
  })
  async canRateRoute(
    @User() user: JwtPayload,
    @Param('routeId', ParseUUIDPipe) routeId: string,
  ) {
    return this.ratingsService.canRateRoute(user.sub, routeId);
  }

  /* ========== ADMIN ========== */

  /**
   * Listado global de calificaciones (admin)
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listado global de calificaciones' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Listado global.' })
  async getAllRatings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ratingsService.getAllRatings(page, limit);
  }

  /**
   * Obtener usuarios con rating bajo (< 3.0)
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Get('low-rated')
  @ApiOperation({ summary: 'Obtener usuarios con rating bajo' })
  @ApiResponse({ status: 200, description: 'Usuarios con rating < 3.0.' })
  async getLowRatedUsers() {
    return this.ratingsService.getLowRatedUsers();
  }
}
