import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { MetodoPagoEnum } from '../../payments/Enums/metodo-pago.enum';

export class CreateBookingDto {
  @ApiProperty({
    description: 'ID de la ruta a reservar',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4')
  routeId: string;

  @ApiProperty({
    description: 'Método de pago seleccionado',
    enum: MetodoPagoEnum,
    example: MetodoPagoEnum.PAYPAL,
  })
  @IsEnum(MetodoPagoEnum)
  metodoPago: MetodoPagoEnum;

  @ApiPropertyOptional({
    description: 'Latitud del punto de recogida (si aplica stop intermedio)',
    example: -12.0464,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  pickupLat?: number;

  @ApiPropertyOptional({
    description: 'Longitud del punto de recogida (si aplica stop intermedio)',
    example: -77.0428,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  pickupLng?: number;

  @ApiPropertyOptional({
    description: 'Dirección del punto de recogida',
    example: 'Av. Universitaria 1234',
  })
  @IsOptional()
  pickupDireccion?: string;
}
