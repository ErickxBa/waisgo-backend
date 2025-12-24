import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Correo institucional (epn.edu.ec)',
    example: 'juan.perez@epn.edu.ec',
  })
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[\w.+-]+@epn\.edu\.ec$/)
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Segura.123',
    minLength: 7,
    maxLength: 20,
  })
  @IsNotEmpty()
  @IsString()
  @Length(7, 20)
  password: string;
}
