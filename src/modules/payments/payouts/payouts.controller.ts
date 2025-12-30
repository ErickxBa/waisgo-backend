import {
  Controller,
  Get,
  Post,
  Patch,
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
import { RolUsuarioEnum } from 'src/modules/auth/Enum';
import { Roles, User } from 'src/modules/common/Decorators';
import { PayoutsService } from './payouts.service';
import { GeneratePayoutsDto } from './Dto';
import type { JwtPayload } from 'src/modules/common/types';

@ApiTags('Payouts')
@ApiBearerAuth('access-token')
@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  /* ========== CONDUCTOR ========== */

  /**
   * Obtener historial de payouts del conductor
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get('my')
  @ApiOperation({ summary: 'Obtener historial de payouts como conductor' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiResponse({ status: 200, description: 'Historial de payouts.' })
  async getMyPayouts(
    @User() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.payoutsService.getMyPayouts(user.sub, status);
  }

  /**
   * Obtener detalle de un payout
   */
  @Roles(RolUsuarioEnum.CONDUCTOR)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un payout' })
  @ApiParam({ name: 'id', description: 'ID del payout' })
  @ApiResponse({ status: 200, description: 'Detalle del payout.' })
  @ApiResponse({ status: 404, description: 'Payout no encontrado.' })
  async getPayoutById(
    @User() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payoutsService.getPayoutById(user.sub, id);
  }

  /* ========== ADMIN ========== */

  /**
   * Generar payouts para un periodo
   * - Suma todos los pagos PAID del periodo
   * - Crea un payout por conductor con fondos pendientes
   * - Agrupa por conductor y periodo (YYYY-MM)
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar payouts para un periodo' })
  @ApiResponse({ status: 201, description: 'Payouts generados.' })
  async generatePayouts(@Body() dto: GeneratePayoutsDto) {
    // TODO:
    // 1. Buscar todos los pagos PAID del periodo que no tengan payoutId
    // 2. Agrupar por conductor (vía booking -> route -> driver)
    // 3. Crear un payout por conductor
    // 4. Asociar los payments al payout
    return this.payoutsService.generatePayouts(dto.period);
  }

  /**
   * Ejecutar payout por PayPal
   * - Llama a PayPal Payouts API
   * - Actualiza status del payout
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Post(':id/paypal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar payout por PayPal' })
  @ApiParam({ name: 'id', description: 'ID del payout' })
  @ApiResponse({ status: 200, description: 'Payout ejecutado.' })
  @ApiResponse({ status: 400, description: 'Error al ejecutar payout.' })
  async executePaypalPayout(@Param('id', ParseUUIDPipe) id: string) {
    // TODO:
    // 1. Obtener payout y validar status PENDING
    // 2. Obtener PayPal email del conductor
    // 3. Llamar a PayPal Payouts API
    // 4. Guardar paypalBatchId
    // 5. Actualizar status según respuesta
    return this.payoutsService.executePaypalPayout(id);
  }

  /**
   * Marcar payout como fallido
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Patch(':id/fail')
  @ApiOperation({ summary: 'Marcar payout como fallido' })
  @ApiParam({ name: 'id', description: 'ID del payout' })
  @ApiResponse({ status: 200, description: 'Payout marcado como fallido.' })
  async failPayout(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.payoutsService.failPayout(id, reason);
  }

  /**
   * Listado global de payouts
   */
  @Roles(RolUsuarioEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Listado global de payouts' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Listado global.' })
  async getAllPayouts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('period') period?: string,
  ) {
    return this.payoutsService.getAllPayouts(page, limit, status, period);
  }
}
