import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min, Max, MaxLength } from 'class-validator';

export class AddStopDto {
  @ApiProperty({
    description: 'Latitud del nuevo punto',
    example: -12.0464,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    description: 'Longitud del nuevo punto',
    example: -77.0428,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiProperty({
    description: 'Dirección del punto',
    example: 'Av. La Marina 2050',
  })
  @IsString()
  @MaxLength(255)
  direccion: string;
}
