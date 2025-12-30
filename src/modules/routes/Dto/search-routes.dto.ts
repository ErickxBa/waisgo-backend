import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchRoutesDto {
  @ApiProperty({
    description: 'Latitud de la ubicación del pasajero',
    example: -12.0464,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat: number;

  @ApiProperty({
    description: 'Longitud de la ubicación del pasajero',
    example: -77.0428,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lng: number;

  @ApiPropertyOptional({
    description: 'Radio de búsqueda en kilómetros (default: 1)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(10)
  @Type(() => Number)
  radiusKm?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha específica',
    example: '2025-01-15',
  })
  @IsOptional()
  @IsDateString()
  fecha?: string;
}
