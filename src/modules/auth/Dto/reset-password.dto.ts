import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token recibido por correo (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description:
      'Nueva contraseña (Min 7 chars, Mayús, Minús, Num, Carácter Esp.)',
    example: 'WasiGo.2025#',
    minLength: 7,
    maxLength: 20,
  })
  @IsString()
  @Length(7, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[/*.@-_#]).+$/, {
    message:
      'La contraseña debe tener mayúsculas, minúsculas, números y caracteres especiales',
  })
  newPassword: string;
}
