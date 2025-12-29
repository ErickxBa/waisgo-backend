import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RoutesService } from './routes.service';
import { User } from '../common/Decorators/user.decorator';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { JweAuthGuard } from '../auth/Guards/jwe-auth.guard';
import { Public } from '../common/Decorators/public.decorator';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Buscar rutas disponibles' })
  @ApiResponse({ status: 200, description: 'Rutas encontradas' })
  async searchRoutes(
    @Query('origen') origen?: string,
    @Query('destino') destino?: string,
    @Query('fechaSalida') fechaSalida?: string,
    @Query('asientos', new DefaultValuePipe(1), ParseIntPipe) asientos?: number,
    @Query('precioMax', new DefaultValuePipe(1000), ParseFloatPipe)
    precioMax?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.routesService.searchRoutes(
      {
        origen,
        destino,
        fechaSalida,
        asientos,
        precioMax,
      },
      limit,
      offset,
    );
  }

  @Public()
  @Get('nearby')
  @ApiOperation({ summary: 'Obtener rutas cercanas' })
  @ApiResponse({ status: 200, description: 'Rutas cercanas' })
  async getNearbyRoutes(
    @Query('origen') origen: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.routesService.getNearbyRoutes(origen, limit);
  }

  @Public()
  @Get('match')
  @ApiOperation({ summary: 'Matching de rutas por origen y destino' })
  @ApiResponse({ status: 200, description: 'Rutas coincidentes' })
  async matchRoutes(
    @Query('origen') origen: string,
    @Query('destinoBase') destinoBase: string,
    @Query('fecha') fecha?: string,
  ) {
    return this.routesService.matchRoutes(
      origen,
      destinoBase,
      fecha,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Obtener ruta por ID' })
  @ApiResponse({ status: 200, description: 'Información de la ruta' })
  async getRoute(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.routesService.getRouteById(id);
  }

  @UseGuards(JweAuthGuard)
  @ApiBearerAuth()
  @Get('my-routes')
  @ApiOperation({ summary: 'Obtener mis rutas' })
  @ApiResponse({ status: 200, description: 'Mis rutas' })
  async getMyRoutes(
    @User() user: JwtPayload,
    @Query('estado') estado?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.routesService.getMyRoutes(user.sub, estado, limit, offset);
  }

  @UseGuards(JweAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear una nueva ruta' })
  @ApiResponse({ status: 201, description: 'Ruta creada' })
  async createRoute(@User() user: JwtPayload, @Body() data: any) {
    return this.routesService.createRoute(user.sub, data);
  }

  @UseGuards(JweAuthGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta' })
  @ApiResponse({ status: 200, description: 'Ruta actualizada' })
  async updateRoute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.routesService.updateRoute(id, user.sub, data);
  }

  @UseGuards(JweAuthGuard)
  @ApiBearerAuth()
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar una ruta' })
  @ApiResponse({ status: 200, description: 'Ruta cancelada' })
  async cancelRoute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @User() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.routesService.cancelRoute(id, user.sub, data?.razon);
  }
}
