import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsDateString,
  IsString,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsOptional,
  MaxLength,
  Matches,
  ValidateNested,
  ArrayMinSize,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CampusOrigenEnum } from '../Enums/campus-origen.enum';
import { ErrorMessages } from '../../common/constants/error-messages.constant';

export class RouteStopDto {
  @ApiProperty({
    description: 'Latitud del punto',
    example: -12.0464,
  })
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitud del punto',
    example: -77.0428,
  })
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Dirección legible del punto',
    example: 'Av. Universitaria 1234',
  })
  @IsString()
  @MaxLength(255)
  direccion: string;
}

export class CreateRouteDto {
  @ApiProperty({
    description: 'Campus de origen',
    enum: CampusOrigenEnum,
    example: CampusOrigenEnum.CAMPUS_PRINCIPAL,
  })
  @IsEnum(CampusOrigenEnum)
  origen: CampusOrigenEnum;

  @ApiProperty({
    description: 'Fecha de la ruta (YYYY-MM-DD)',
    example: '2025-01-15',
  })
  @IsDateString()
  fecha: string;

  @ApiProperty({
    description: 'Hora de salida (HH:mm)',
    example: '14:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: ErrorMessages.VALIDATION.INVALID_FORMAT('horaSalida'),
  })
  horaSalida: string;

  @ApiProperty({
    description: 'Destino base de la ruta',
    example: 'San Miguel',
  })
  @IsString()
  @MaxLength(255)
  destinoBase: string;

  @ApiProperty({
    description: 'Cantidad de asientos disponibles',
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(8)
  asientosTotales: number;

  @ApiProperty({
    description: 'Precio por pasajero',
    example: 2.5,
  })
  @IsNumber()
  @Min(0.1, { message: ErrorMessages.ROUTES.ROUTE_PRICE_REQUIRED })
  @Type(() => Number)
  precioPasajero: number;

  @ApiPropertyOptional({
    description: 'Mensaje opcional del conductor',
    example: 'Salgo puntual, no espero más de 5 min',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  mensaje?: string;

  @ApiProperty({
    description: 'Paradas de la ruta ordenadas',
    type: [RouteStopDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops: RouteStopDto[];
}
