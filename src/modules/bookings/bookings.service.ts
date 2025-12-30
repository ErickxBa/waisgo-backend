import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './Models/booking.entity';
import { CreateBookingDto } from './Dto';
import { EstadoReservaEnum } from './Enums';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * Genera un OTP de 6 dígitos
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Crear una reserva
   * TODO: Implementar lógica completa
   */
  async createBooking(
    passengerId: string,
    dto: CreateBookingDto,
  ): Promise<{ message: string; bookingId?: string; otp?: string }> {
    // TODO:
    // 1. Verificar rating del pasajero >= 3.0
    // 2. Verificar que no tenga deudas pendientes
    // 3. Verificar que la ruta existe y tiene asientos
    // 4. Verificar que el pasajero no tenga ya una reserva en esta ruta
    // 5. Crear booking
    // 6. Generar OTP
    // 7. Si hay pickup coords, crear stop intermedio
    // 8. Reducir asientos disponibles
    // 9. Iniciar flujo de pago según método

    const otp = this.generateOtp();

    return {
      message: 'Reserva creada y confirmada correctamente.',
      // bookingId: booking.id,
      // otp: otp,
    };
  }

  /**
   * Obtener reservas del pasajero
   */
  async getMyBookings(
    passengerId: string,
    estado?: string,
  ): Promise<{ message: string; data?: Booking[] }> {
    // TODO: Filtrar por passengerId y opcionalmente por estado
    return {
      message: 'Listado de reservas del pasajero.',
    };
  }

  /**
   * Obtener detalle de una reserva
   */
  async getBookingById(
    passengerId: string,
    bookingId: string,
  ): Promise<{ message: string; data?: Booking }> {
    // TODO: Buscar booking y validar que pertenezca al pasajero
    return {
      message: 'Detalle de la reserva.',
    };
  }

  /**
   * Cancelar una reserva
   */
  async cancelBooking(
    passengerId: string,
    bookingId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que la reserva pertenezca al pasajero
    // 2. Validar estado actual (solo CONFIRMADA puede cancelarse)
    // 3. Validar tiempo antes del viaje (política de cancelación)
    // 4. Cambiar estado a CANCELADA
    // 5. Liberar asiento en la ruta
    // 6. Procesar reversión de pago si aplica

    return {
      message: 'Reserva cancelada correctamente.',
    };
  }

  /**
   * Obtener mapa de la ruta (solo si booking activo)
   */
  async getBookingMap(
    passengerId: string,
    bookingId: string,
  ): Promise<{ message: string; stops?: any[] }> {
    // TODO:
    // 1. Buscar booking
    // 2. Validar que pertenezca al pasajero
    // 3. Validar que estado sea CONFIRMADA (no COMPLETADA/CANCELADA/NO_SHOW)
    // 4. Retornar coordenadas de la ruta

    return {
      message: 'Mapa de la ruta visible porque la reserva está activa.',
    };
  }

  /**
   * Obtener pasajeros de una ruta (para conductor)
   */
  async getBookingsByRoute(
    driverId: string,
    routeId: string,
  ): Promise<{ message: string; data?: Booking[] }> {
    // TODO:
    // 1. Validar que la ruta pertenezca al conductor (via driver)
    // 2. Retornar todos los bookings de la ruta con datos del pasajero

    return {
      message: 'Listado de pasajeros confirmados en la ruta.',
    };
  }

  /**
   * Marcar pasajero como llegado (completar booking)
   */
  async completeBooking(
    driverId: string,
    bookingId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que el booking pertenezca a una ruta del conductor
    // 2. Validar que el OTP fue usado
    // 3. Cambiar estado a COMPLETADA
    // El pasajero ya no podrá ver el mapa

    return {
      message: 'Pasajero marcado como llegado. Ya no puede ver la ruta.',
    };
  }

  /**
   * Marcar pasajero como NO_SHOW
   */
  async markNoShow(
    driverId: string,
    bookingId: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que el booking pertenezca a una ruta del conductor
    // 2. Validar que hayan pasado 30 min desde hora de salida
    // 3. Cambiar estado a NO_SHOW
    // 4. Si pago digital: conductor recibe 50%, pasajero pierde 50%
    // 5. Si efectivo: pasajero queda con deuda

    return {
      message: 'Pasajero marcado como NO_SHOW.',
    };
  }

  /**
   * Verificar OTP del pasajero
   */
  async verifyOtp(
    driverId: string,
    bookingId: string,
    otp: string,
  ): Promise<{ message: string }> {
    // TODO:
    // 1. Validar que el booking pertenezca a una ruta del conductor
    // 2. Validar que el OTP no haya sido usado
    // 3. Validar que el OTP coincida
    // 4. Marcar otpUsado = true
    // 5. Si es efectivo, confirmar que el pasajero pagó

    return {
      message: 'OTP validado. Pasajero autorizado a viajar.',
    };
  }
}
