import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Código OTP de 6 dígitos',
    example: '123456',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'El OTP debe ser de 6 dígitos numéricos' })
  otp: string;
}
