import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo electrónico registrado',
    example: 'usuario@epn.edu.ec',
  })
  @IsEmail()
  email: string;
}
