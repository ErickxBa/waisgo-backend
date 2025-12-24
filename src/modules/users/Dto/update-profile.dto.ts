import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(3, 15)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El nombre solo puede contener letras',
  })
  nombre?: string;

  @IsOptional()
  @IsString()
  @Length(3, 15)
  @Matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/, {
    message: 'El apellido solo puede contener letras',
  })
  apellido?: string;

  @IsOptional()
  @IsString()
  @Matches(/^09\d{8}$/, {
    message: 'Celular inválido',
  })
  celular?: string;
}
