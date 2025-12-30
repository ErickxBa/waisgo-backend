import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class GeneratePayoutsDto {
  @ApiProperty({
    description: 'Periodo para generar payouts (formato YYYY-MM)',
    example: '2025-01',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'El periodo debe estar en formato YYYY-MM',
  })
  period: string;
}
