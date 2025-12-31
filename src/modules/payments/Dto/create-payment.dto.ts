import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsEnum } from 'class-validator';
import { MetodoPagoEnum } from '../Enums/metodo-pago.enum';
import { ErrorMessages } from '../../common/constants/error-messages.constant';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID de la reserva asociada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID('4')
  bookingId: string;

  @ApiProperty({
    description: 'Método de pago',
    enum: MetodoPagoEnum,
    example: MetodoPagoEnum.PAYPAL,
  })
  @IsEnum(MetodoPagoEnum, {
    message: ErrorMessages.PAYMENTS.INVALID_PAYMENT_METHOD,
  })
  method: MetodoPagoEnum;
}
