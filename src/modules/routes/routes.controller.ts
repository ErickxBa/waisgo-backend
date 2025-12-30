import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
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
import { RoutesService } from './routes.service';
import { CreateRouteDto, SearchRoutesDto, AddStopDto } from './Dto';
import type { JwtPayload } from '../common/types';

@ApiTags('Routes')
@ApiBearerAuth('access-token')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  /* ================= CONDUCTOR ================= */

  /**
   * Crear una ruta
   * - Solo conductores aprobados
   * - Guarda origen, destino, fecha, hora, asientos
   * - Guarda stops ordenados (solo coordenadas, NO mapa visual)
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva ruta' })
  @ApiResponse({ status: 201, description: 'Ruta creada correctamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o conductor bloqueado.',
  })
  async createRoute(@User() user: JwtPayload, @Body() dto: CreateRouteDto) {
    // TODO:
    // 1. Validar que el conductor esté APROBADO
    // 2. Validar que no tenga rating < 3.0
    // 3. Crear ruta con estado ACTIVA
    // 4. Crear route_stops ordenados
    return this.routesService.createRoute(user.sub, dto);
  }

  /**
   * Obtener mis rutas como conductor
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get('my')
  @ApiOperation({ summary: 'Obtener mis rutas como conductor' })
  @ApiQuery({
    name: 'estado',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiResponse({ status: 200, description: 'Listado de rutas.' })
  async getMyRoutes(
    @User() user: JwtPayload,
    @Query('estado') estado?: string,
  ) {
    return this.routesService.getMyRoutes(user.sub, estado);
  }

  /* ================= PASAJERO ================= */

  /**
   * Buscar rutas disponibles cercanas
   * - Usa Haversine para calcular distancia (NO Google Maps API)
   * - Retorna rutas con stops dentro de 1km del pasajero
   */
  @Roles(RolUsuarioEnum.PASAJERO)
  @Get('available')
  @ApiOperation({ summary: 'Buscar rutas disponibles cerca de mi ubicación' })
  @ApiResponse({ status: 200, description: 'Listado de rutas cercanas.' })
  async getAvailableRoutes(
    @User() user: JwtPayload,
    @Query() dto: SearchRoutesDto,
  ) {
    // TODO:
    // 1. Recorrer route_stops de rutas ACTIVAS
    // 2. Calcular distancia con Haversine
    // 3. Filtrar las que tengan stops dentro del radio
    // 4. Solo rutas con asientos disponibles > 0
    return this.routesService.getAvailableRoutes(dto);
  }

  /* ================= AMBOS ROLES ================= */

  /**
   * Obtener detalle de una ruta
   */
  @Roles(RolUsuarioEnum.CONDUCTOR, RolUsuarioEnum.PASAJERO)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una ruta' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Detalle de la ruta.' })
  @ApiResponse({ status: 404, description: 'Ruta no encontrada.' })
  async getRouteById(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.routesService.getRouteById(id);
  }

  /**
   * Obtener coordenadas del mapa de una ruta
   * - Retorna los stops con lat/lng para visualización
   * - El frontend se encarga de renderizar el mapa
   */
  @Roles(RolUsuarioEnum.CONDUCTOR, RolUsuarioEnum.PASAJERO)
  @Get(':id/map')
  @ApiOperation({ summary: 'Obtener coordenadas de la ruta para el mapa' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Coordenadas de stops.' })
  async getRouteMap(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO: Solo retornar stops ordenados con lat/lng
    // El frontend construye el mapa visual
    return this.routesService.getRouteMap(id);
  }

  /**
   * Agregar parada intermedia a una ruta
   * - Recalcula el orden de los stops
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Post(':id/stops')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar parada intermedia a la ruta' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 201, description: 'Parada agregada.' })
  async addRouteStop(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddStopDto,
  ) {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Validar que la ruta esté ACTIVA
    // 3. Agregar stop y recalcular orden
    return this.routesService.addRouteStop(user.sub, id, dto);
  }

  /* ================= CONDUCTOR - GESTIÓN ================= */

  /**
   * Cancelar una ruta
   * - Aplica reversión de pagos a todos los pasajeros
   * - Penalización al conductor
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una ruta' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Ruta cancelada.' })
  @ApiResponse({ status: 400, description: 'No se puede cancelar.' })
  async cancelRoute(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Cambiar estado a CANCELADA
    // 3. Cancelar todos los bookings
    // 4. Revertir pagos digitales
    // 5. Aplicar penalización al conductor
    return this.routesService.cancelRoute(user.sub, id);
  }

  /**
   * Finalizar una ruta
   * - Solo cuando todos los pasajeros han sido marcados como llegados
   * - La ruta ya no es visible para nadie
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Patch(':id/finalize')
  @ApiOperation({ summary: 'Finalizar una ruta completada' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  @ApiResponse({ status: 200, description: 'Ruta finalizada.' })
  async finalizeRoute(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor
    // 2. Validar que todos los bookings estén COMPLETADA o NO_SHOW
    // 3. Cambiar estado a FINALIZADA
    return this.routesService.finalizeRoute(user.sub, id);
  }
}
