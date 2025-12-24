import { IsString, Length, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @Length(7, 20)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[/*.@-_#]).+$/, {
    message:
      'La contraseña debe tener mayúsculas, minúsculas, números y caracteres especiales',
  })
  newPassword: string;
}
