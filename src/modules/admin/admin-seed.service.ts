import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcrypt';

import { BusinessUser } from '../business/Models/business-user.entity';
import { UserProfile } from '../business/Models/user-profile.entity';
import { Driver } from '../drivers/Models/driver.entity';
import { DriverDocument } from '../drivers/Models/driver-document.entity';
import { Vehicle } from '../drivers/Models/vehicle.entity';
import { Route } from '../routes/Models/route.entity';
import { RouteStop } from '../routes/Models/route-stop.entity';
import { Booking } from '../bookings/Models/booking.entity';
import { Payment } from '../payments/Models/payment.entity';
import { Payout } from '../payments/Models/payout.entity';
import { Rating } from '../ratings/Models/rating.entity';
import { AuthUser } from '../auth/Models/auth-user.entity';
import { EstadoVerificacionEnum, RolUsuarioEnum } from '../auth/Enum';
import {
  EstadoConductorEnum,
  EstadoDocumentoEnum,
  TipoDocumentoEnum,
} from '../drivers/Enums';
import { CampusOrigenEnum, EstadoRutaEnum } from '../routes/Enums';
import { EstadoReservaEnum } from '../bookings/Enums';
import {
  EstadoPagoEnum,
  MetodoPagoEnum,
  EstadoPayoutEnum,
} from '../payments/Enums';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditResult } from '../audit/Enums';
import { ErrorMessages } from '../common/constants/error-messages.constant';
import type { AuthContext } from '../common/types';

type SeedResult = {
  message: string;
  data?: Record<string, unknown>;
};

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(BusinessUser)
    private readonly businessUserRepo: Repository<BusinessUser>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  private getPeriod(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getDateString(date: Date, offsetDays: number): string {
    const next = new Date(date);
    next.setUTCDate(next.getUTCDate() + offsetDays);
    return next.toISOString().slice(0, 10);
  }

  async seedDatabase(
    adminUserId: string,
    context?: AuthContext,
  ): Promise<SeedResult> {
    const seedEmail = 'seed.driver1@epn.edu.ec';
    const seedAlias = 'seed_driver_1';
    const existing = await this.businessUserRepo.findOne({
      where: { alias: seedAlias },
    });

    if (existing) {
      return { message: ErrorMessages.ADMIN.SEED_ALREADY_RUN };
    }

    const seedPassword = 'Seed.123';
    const passwordHash = await bcrypt.hash(seedPassword, 12);

    const driverOneEmail = seedEmail;
    const driverTwoEmail = 'seed.driver2@epn.edu.ec';
    const driverThreeEmail = 'seed.driver3@epn.edu.ec';
    const passengerOneEmail = 'seed.passenger1@epn.edu.ec';
    const passengerTwoEmail = 'seed.passenger2@epn.edu.ec';
    const passengerThreeEmail = 'seed.passenger3@epn.edu.ec';
    const passengerFourEmail = 'seed.passenger4@epn.edu.ec';
    const passengerFiveEmail = 'seed.passenger5@epn.edu.ec';
    const passengerSixEmail = 'seed.passenger6@epn.edu.ec';
    const adminEmail = 'seed.admin@epn.edu.ec';
    const userEmail = 'seed.user@epn.edu.ec';

    const now = new Date();
    const today = this.getDateString(now, 0);
    const tomorrow = this.getDateString(now, 1);
    const yesterday = this.getDateString(now, -1);
    const period = this.getPeriod(now);

    const driverOneId = randomUUID();
    const driverTwoId = randomUUID();
    const driverThreeId = randomUUID();
    const passengerOneId = randomUUID();
    const passengerTwoId = randomUUID();
    const passengerThreeId = randomUUID();
    const passengerFourId = randomUUID();
    const passengerFiveId = randomUUID();
    const passengerSixId = randomUUID();
    const adminId = randomUUID();
    const userId = randomUUID();

    const result = await this.dataSource.transaction(async (manager) => {
      const businessRepo = manager.getRepository(BusinessUser);
      const profileRepo = manager.getRepository(UserProfile);
      const driverRepo = manager.getRepository(Driver);
      const documentRepo = manager.getRepository(DriverDocument);
      const vehicleRepo = manager.getRepository(Vehicle);
      const routeRepo = manager.getRepository(Route);
      const bookingRepo = manager.getRepository(Booking);
      const paymentRepo = manager.getRepository(Payment);
      const payoutRepo = manager.getRepository(Payout);
      const ratingRepo = manager.getRepository(Rating);
      const authRepo = manager.getRepository(AuthUser);

      const createStops = (lat: number, lng: number, label: string) => [
        manager.create(RouteStop, {
          lat,
          lng,
          direccion: `${label} Stop 1`,
          orden: 1,
        }),
        manager.create(RouteStop, {
          lat: lat + 0.002,
          lng: lng + 0.002,
          direccion: `${label} Stop 2`,
          orden: 2,
        }),
      ];

      const authUsers = [
        authRepo.create({
          id: driverOneId,
          email: driverOneEmail,
          rol: RolUsuarioEnum.CONDUCTOR,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: driverTwoId,
          email: driverTwoEmail,
          rol: RolUsuarioEnum.CONDUCTOR,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: driverThreeId,
          email: driverThreeEmail,
          rol: RolUsuarioEnum.CONDUCTOR,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerOneId,
          email: passengerOneEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerTwoId,
          email: passengerTwoEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerThreeId,
          email: passengerThreeEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerFourId,
          email: passengerFourEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerFiveId,
          email: passengerFiveEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: passengerSixId,
          email: passengerSixEmail,
          rol: RolUsuarioEnum.PASAJERO,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: adminId,
          email: adminEmail,
          rol: RolUsuarioEnum.ADMIN,
          estadoVerificacion: EstadoVerificacionEnum.VERIFICADO,
          credential: { passwordHash },
        }),
        authRepo.create({
          id: userId,
          email: userEmail,
          rol: RolUsuarioEnum.USER,
          estadoVerificacion: EstadoVerificacionEnum.NO_VERIFICADO,
          credential: { passwordHash },
        }),
      ];

      await authRepo.save(authUsers);

      await businessRepo.save([
        businessRepo.create({
          id: driverOneId,
          email: driverOneEmail,
          alias: seedAlias,
          profile: profileRepo.create({
            userId: driverOneId,
            nombre: 'Seed',
            apellido: 'Driver1',
            celular: '0999999901',
            ratingPromedio: 4.6,
            totalViajes: 5,
            totalCalificaciones: 5,
          }),
        }),
        businessRepo.create({
          id: driverTwoId,
          email: driverTwoEmail,
          alias: 'seed_driver_2',
          profile: profileRepo.create({
            userId: driverTwoId,
            nombre: 'Seed',
            apellido: 'Driver2',
            celular: '0999999902',
            ratingPromedio: 4.4,
            totalViajes: 4,
            totalCalificaciones: 4,
          }),
        }),
        businessRepo.create({
          id: driverThreeId,
          email: driverThreeEmail,
          alias: 'seed_driver_3',
          profile: profileRepo.create({
            userId: driverThreeId,
            nombre: 'Seed',
            apellido: 'Driver3',
            celular: '0999999903',
            ratingPromedio: 4.8,
            totalViajes: 3,
            totalCalificaciones: 3,
          }),
        }),
        businessRepo.create({
          id: passengerOneId,
          email: passengerOneEmail,
          alias: 'seed_passenger_1',
          profile: profileRepo.create({
            userId: passengerOneId,
            nombre: 'Seed',
            apellido: 'Passenger1',
            celular: '0999999911',
            ratingPromedio: 4.0,
            totalViajes: 2,
            totalCalificaciones: 2,
          }),
        }),
        businessRepo.create({
          id: passengerTwoId,
          email: passengerTwoEmail,
          alias: 'seed_passenger_2',
          profile: profileRepo.create({
            userId: passengerTwoId,
            nombre: 'Seed',
            apellido: 'Passenger2',
            celular: '0999999912',
            ratingPromedio: 4.5,
            totalViajes: 3,
            totalCalificaciones: 3,
          }),
        }),
        businessRepo.create({
          id: passengerThreeId,
          email: passengerThreeEmail,
          alias: 'seed_passenger_3',
          profile: profileRepo.create({
            userId: passengerThreeId,
            nombre: 'Seed',
            apellido: 'Passenger3',
            celular: '0999999913',
            ratingPromedio: 3.8,
            totalViajes: 1,
            totalCalificaciones: 1,
          }),
        }),
        businessRepo.create({
          id: passengerFourId,
          email: passengerFourEmail,
          alias: 'seed_passenger_4',
          profile: profileRepo.create({
            userId: passengerFourId,
            nombre: 'Seed',
            apellido: 'Passenger4',
            celular: '0999999914',
            ratingPromedio: 4.2,
            totalViajes: 2,
            totalCalificaciones: 2,
          }),
        }),
        businessRepo.create({
          id: passengerFiveId,
          email: passengerFiveEmail,
          alias: 'seed_passenger_5',
          profile: profileRepo.create({
            userId: passengerFiveId,
            nombre: 'Seed',
            apellido: 'Passenger5',
            celular: '0999999915',
            ratingPromedio: 4.1,
            totalViajes: 1,
            totalCalificaciones: 1,
          }),
        }),
        businessRepo.create({
          id: passengerSixId,
          email: passengerSixEmail,
          alias: 'seed_passenger_6',
          profile: profileRepo.create({
            userId: passengerSixId,
            nombre: 'Seed',
            apellido: 'Passenger6',
            celular: '0999999916',
            ratingPromedio: 4.7,
            totalViajes: 2,
            totalCalificaciones: 2,
          }),
        }),
        businessRepo.create({
          id: adminId,
          email: adminEmail,
          alias: 'seed_admin',
          profile: profileRepo.create({
            userId: adminId,
            nombre: 'Seed',
            apellido: 'Admin',
            celular: '0999999900',
          }),
        }),
        businessRepo.create({
          id: userId,
          email: userEmail,
          alias: 'seed_user',
          profile: profileRepo.create({
            userId: userId,
            nombre: 'Seed',
            apellido: 'User',
            celular: '0999999909',
          }),
        }),
      ]);

      const driverOne = await driverRepo.save(
        driverRepo.create({
          userId: driverOneId,
          paypalEmail: 'seed.driver1@paypal.com',
          estado: EstadoConductorEnum.APROBADO,
          fechaAprobacion: now,
        }),
      );
      const driverTwo = await driverRepo.save(
        driverRepo.create({
          userId: driverTwoId,
          paypalEmail: 'seed.driver2@paypal.com',
          estado: EstadoConductorEnum.APROBADO,
          fechaAprobacion: now,
        }),
      );
      const driverThree = await driverRepo.save(
        driverRepo.create({
          userId: driverThreeId,
          paypalEmail: 'seed.driver3@paypal.com',
          estado: EstadoConductorEnum.APROBADO,
          fechaAprobacion: now,
        }),
      );

      await documentRepo.save([
        documentRepo.create({
          driverId: driverOne.id,
          tipo: TipoDocumentoEnum.LICENCIA,
          archivoUrl: 'seed/driver1/licencia.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
        documentRepo.create({
          driverId: driverOne.id,
          tipo: TipoDocumentoEnum.MATRICULA,
          archivoUrl: 'seed/driver1/matricula.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
        documentRepo.create({
          driverId: driverTwo.id,
          tipo: TipoDocumentoEnum.LICENCIA,
          archivoUrl: 'seed/driver2/licencia.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
        documentRepo.create({
          driverId: driverTwo.id,
          tipo: TipoDocumentoEnum.MATRICULA,
          archivoUrl: 'seed/driver2/matricula.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
        documentRepo.create({
          driverId: driverThree.id,
          tipo: TipoDocumentoEnum.LICENCIA,
          archivoUrl: 'seed/driver3/licencia.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
        documentRepo.create({
          driverId: driverThree.id,
          tipo: TipoDocumentoEnum.MATRICULA,
          archivoUrl: 'seed/driver3/matricula.pdf',
          estado: EstadoDocumentoEnum.APROBADO,
        }),
      ]);

      await vehicleRepo.save([
        vehicleRepo.create({
          driverId: driverOne.id,
          marca: 'Toyota',
          modelo: 'Corolla',
          color: 'Blanco',
          placa: 'SEA1234',
          asientosDisponibles: 4,
          isActivo: true,
        }),
        vehicleRepo.create({
          driverId: driverTwo.id,
          marca: 'Chevrolet',
          modelo: 'Spark',
          color: 'Azul',
          placa: 'SEB1234',
          asientosDisponibles: 4,
          isActivo: true,
        }),
        vehicleRepo.create({
          driverId: driverThree.id,
          marca: 'Kia',
          modelo: 'Rio',
          color: 'Gris',
          placa: 'SEC1234',
          asientosDisponibles: 3,
          isActivo: true,
        }),
      ]);

      const routeOne = await routeRepo.save(
        routeRepo.create({
          driverId: driverOne.id,
          origen: CampusOrigenEnum.CAMPUS_PRINCIPAL,
          fecha: today,
          horaSalida: '08:30',
          destinoBase: 'Centro',
          asientosTotales: 3,
          asientosDisponibles: 0,
          precioPasajero: 1.5,
          estado: EstadoRutaEnum.FINALIZADA,
          mensaje: 'Seed route 1',
          stops: createStops(-0.2101, -78.4896, 'R1'),
        }),
      );

      const routeTwo = await routeRepo.save(
        routeRepo.create({
          driverId: driverOne.id,
          origen: CampusOrigenEnum.EL_BOSQUE,
          fecha: tomorrow,
          horaSalida: '07:45',
          destinoBase: 'Terminal',
          asientosTotales: 3,
          asientosDisponibles: 2,
          precioPasajero: 1.0,
          estado: EstadoRutaEnum.ACTIVA,
          mensaje: 'Seed route 2',
          stops: createStops(-0.206, -78.5001, 'R2'),
        }),
      );

      const routeThree = await routeRepo.save(
        routeRepo.create({
          driverId: driverTwo.id,
          origen: CampusOrigenEnum.CAMPUS_PRINCIPAL,
          fecha: yesterday,
          horaSalida: '09:15',
          destinoBase: 'Centro Norte',
          asientosTotales: 4,
          asientosDisponibles: 2,
          precioPasajero: 2.0,
          estado: EstadoRutaEnum.FINALIZADA,
          mensaje: 'Seed route 3',
          stops: createStops(-0.215, -78.4705, 'R3'),
        }),
      );

      const routeFour = await routeRepo.save(
        routeRepo.create({
          driverId: driverTwo.id,
          origen: CampusOrigenEnum.EL_BOSQUE,
          fecha: today,
          horaSalida: '18:00',
          destinoBase: 'Estacion',
          asientosTotales: 3,
          asientosDisponibles: 3,
          precioPasajero: 1.8,
          estado: EstadoRutaEnum.CANCELADA,
          mensaje: 'Seed route 4 cancelled',
          stops: createStops(-0.2302, -78.5102, 'R4'),
        }),
      );

      const routeFive = await routeRepo.save(
        routeRepo.create({
          driverId: driverThree.id,
          origen: CampusOrigenEnum.CAMPUS_PRINCIPAL,
          fecha: tomorrow,
          horaSalida: '12:00',
          destinoBase: 'Parque',
          asientosTotales: 2,
          asientosDisponibles: 2,
          precioPasajero: 1.2,
          estado: EstadoRutaEnum.ACTIVA,
          mensaje: 'Seed route 5',
          stops: createStops(-0.2002, -78.4802, 'R5'),
        }),
      );

      const routeSix = await routeRepo.save(
        routeRepo.create({
          driverId: driverThree.id,
          origen: CampusOrigenEnum.EL_BOSQUE,
          fecha: yesterday,
          horaSalida: '15:20',
          destinoBase: 'Centro Sur',
          asientosTotales: 2,
          asientosDisponibles: 0,
          precioPasajero: 1.3,
          estado: EstadoRutaEnum.FINALIZADA,
          mensaje: 'Seed route 6',
          stops: createStops(-0.2251, -78.495, 'R6'),
        }),
      );

      const bookingOne = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeOne.id,
          passengerId: passengerOneId,
          estado: EstadoReservaEnum.COMPLETADA,
          otp: '111111',
          otpUsado: true,
          metodoPago: MetodoPagoEnum.PAYPAL,
        }),
      );

      const bookingTwo = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeOne.id,
          passengerId: passengerTwoId,
          estado: EstadoReservaEnum.COMPLETADA,
          otp: '222222',
          otpUsado: true,
          metodoPago: MetodoPagoEnum.TARJETA,
        }),
      );

      const bookingThree = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeOne.id,
          passengerId: passengerThreeId,
          estado: EstadoReservaEnum.NO_SHOW,
          otp: '333333',
          otpUsado: false,
          metodoPago: MetodoPagoEnum.EFECTIVO,
        }),
      );

      const bookingFour = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeTwo.id,
          passengerId: passengerFourId,
          estado: EstadoReservaEnum.CONFIRMADA,
          otp: '444444',
          otpUsado: false,
          metodoPago: MetodoPagoEnum.PAYPAL,
        }),
      );

      const bookingFive = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeThree.id,
          passengerId: passengerFourId,
          estado: EstadoReservaEnum.COMPLETADA,
          otp: '555555',
          otpUsado: true,
          metodoPago: MetodoPagoEnum.PAYPAL,
        }),
      );

      const bookingSix = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeThree.id,
          passengerId: passengerFiveId,
          estado: EstadoReservaEnum.NO_SHOW,
          otp: '666666',
          otpUsado: false,
          metodoPago: MetodoPagoEnum.EFECTIVO,
        }),
      );

      const bookingSeven = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeFour.id,
          passengerId: passengerSixId,
          estado: EstadoReservaEnum.CANCELADA,
          otp: '777777',
          otpUsado: false,
          metodoPago: MetodoPagoEnum.TARJETA,
          cancelledAt: now,
        }),
      );

      const bookingEight = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeSix.id,
          passengerId: passengerTwoId,
          estado: EstadoReservaEnum.COMPLETADA,
          otp: '888888',
          otpUsado: true,
          metodoPago: MetodoPagoEnum.EFECTIVO,
        }),
      );

      const bookingNine = await bookingRepo.save(
        bookingRepo.create({
          routeId: routeSix.id,
          passengerId: passengerSixId,
          estado: EstadoReservaEnum.COMPLETADA,
          otp: '999999',
          otpUsado: true,
          metodoPago: MetodoPagoEnum.PAYPAL,
        }),
      );

      const paymentOne = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingOne.id,
          amount: Number(routeOne.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.PAYPAL,
          status: EstadoPagoEnum.PAID,
          paypalOrderId: 'seed-order-1',
          paypalCaptureId: 'seed-cap-1',
          paidAt: now,
        }),
      );

      const paymentTwo = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingTwo.id,
          amount: Number(routeOne.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.TARJETA,
          status: EstadoPagoEnum.PAID,
          paypalOrderId: 'seed-order-2',
          paypalCaptureId: 'seed-cap-2',
          paidAt: now,
        }),
      );

      const paymentThree = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingFour.id,
          amount: Number(routeTwo.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.PAYPAL,
          status: EstadoPagoEnum.PENDING,
          paypalOrderId: 'seed-order-3',
        }),
      );

      const paymentFour = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingFive.id,
          amount: Number(routeThree.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.PAYPAL,
          status: EstadoPagoEnum.PAID,
          paypalOrderId: 'seed-order-4',
          paypalCaptureId: 'seed-cap-4',
          paidAt: now,
        }),
      );

      const paymentFive = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingSeven.id,
          amount: Number(routeFour.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.TARJETA,
          status: EstadoPagoEnum.REVERSED,
          paypalOrderId: 'seed-order-5',
          paypalCaptureId: 'seed-cap-5',
          reversedAt: now,
        }),
      );

      const paymentSix = await paymentRepo.save(
        paymentRepo.create({
          bookingId: bookingNine.id,
          amount: Number(routeSix.precioPasajero),
          currency: 'USD',
          method: MetodoPagoEnum.PAYPAL,
          status: EstadoPagoEnum.PAID,
          paypalOrderId: 'seed-order-6',
          paypalCaptureId: 'seed-cap-6',
          paidAt: now,
        }),
      );

      const payoutOneAmount = Number(
        (Number(paymentOne.amount) + Number(paymentTwo.amount)).toFixed(2),
      );
      const payoutTwoAmount = Number(paymentFour.amount);
      const payoutThreeAmount = Number(paymentSix.amount);

      const payoutOne = await payoutRepo.save(
        payoutRepo.create({
          driverId: driverOne.id,
          period,
          amount: payoutOneAmount,
          status: EstadoPayoutEnum.PAID,
          paypalBatchId: 'seed-batch-1',
          attempts: 1,
          paidAt: now,
        }),
      );
      const payoutTwo = await payoutRepo.save(
        payoutRepo.create({
          driverId: driverTwo.id,
          period,
          amount: payoutTwoAmount,
          status: EstadoPayoutEnum.PENDING,
        }),
      );
      const payoutThree = await payoutRepo.save(
        payoutRepo.create({
          driverId: driverThree.id,
          period,
          amount: payoutThreeAmount,
          status: EstadoPayoutEnum.FAILED,
          attempts: 1,
          lastError: 'seed failure',
        }),
      );

      paymentOne.payoutId = payoutOne.id;
      paymentTwo.payoutId = payoutOne.id;
      paymentFour.payoutId = payoutTwo.id;
      paymentSix.payoutId = payoutThree.id;
      await paymentRepo.save([paymentOne, paymentTwo, paymentFour, paymentSix]);

      await ratingRepo.save([
        ratingRepo.create({
          fromUserId: passengerOneId,
          toUserId: driverOneId,
          routeId: routeOne.id,
          score: 5,
          comment: 'Great ride',
        }),
        ratingRepo.create({
          fromUserId: driverOneId,
          toUserId: passengerOneId,
          routeId: routeOne.id,
          score: 4,
          comment: 'Good passenger',
        }),
        ratingRepo.create({
          fromUserId: passengerTwoId,
          toUserId: driverOneId,
          routeId: routeOne.id,
          score: 4,
          comment: 'Nice driver',
        }),
        ratingRepo.create({
          fromUserId: driverOneId,
          toUserId: passengerTwoId,
          routeId: routeOne.id,
          score: 5,
          comment: 'On time',
        }),
        ratingRepo.create({
          fromUserId: passengerThreeId,
          toUserId: driverOneId,
          routeId: routeOne.id,
          score: 3,
          comment: 'No show',
        }),
        ratingRepo.create({
          fromUserId: passengerFourId,
          toUserId: driverTwoId,
          routeId: routeThree.id,
          score: 5,
          comment: 'Smooth ride',
        }),
        ratingRepo.create({
          fromUserId: driverTwoId,
          toUserId: passengerFourId,
          routeId: routeThree.id,
          score: 4,
          comment: 'Great rider',
        }),
        ratingRepo.create({
          fromUserId: passengerFiveId,
          toUserId: driverTwoId,
          routeId: routeThree.id,
          score: 4,
          comment: 'Good route',
        }),
        ratingRepo.create({
          fromUserId: passengerTwoId,
          toUserId: driverThreeId,
          routeId: routeSix.id,
          score: 5,
          comment: 'Excellent',
        }),
        ratingRepo.create({
          fromUserId: driverThreeId,
          toUserId: passengerTwoId,
          routeId: routeSix.id,
          score: 4,
          comment: 'Friendly rider',
        }),
        ratingRepo.create({
          fromUserId: passengerSixId,
          toUserId: driverThreeId,
          routeId: routeSix.id,
          score: 5,
          comment: 'Very good',
        }),
        ratingRepo.create({
          fromUserId: driverThreeId,
          toUserId: passengerSixId,
          routeId: routeSix.id,
          score: 4,
          comment: 'Nice trip',
        }),
      ]);

      return {
        authUsersCount: authUsers.length,
        drivers: [driverOne.id, driverTwo.id, driverThree.id],
        routes: [
          routeOne.id,
          routeTwo.id,
          routeThree.id,
          routeFour.id,
          routeFive.id,
          routeSix.id,
        ],
        bookings: [
          bookingOne.id,
          bookingTwo.id,
          bookingThree.id,
          bookingFour.id,
          bookingFive.id,
          bookingSix.id,
          bookingSeven.id,
          bookingEight.id,
          bookingNine.id,
        ],
        payments: [
          paymentOne.id,
          paymentTwo.id,
          paymentThree.id,
          paymentFour.id,
          paymentFive.id,
          paymentSix.id,
        ],
        payouts: [payoutOne.id, payoutTwo.id, payoutThree.id],
        ratingsCount: 12,
      };
    });

    const loginInfo = {
      password: seedPassword,
      accounts: [
        {
          role: RolUsuarioEnum.ADMIN,
          email: adminEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.USER,
          email: userEmail,
          verified: false,
        },
        {
          role: RolUsuarioEnum.CONDUCTOR,
          email: driverOneEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.CONDUCTOR,
          email: driverTwoEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.CONDUCTOR,
          email: driverThreeEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerOneEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerTwoEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerThreeEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerFourEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerFiveEmail,
          verified: true,
        },
        {
          role: RolUsuarioEnum.PASAJERO,
          email: passengerSixEmail,
          verified: true,
        },
      ],
    };

    await this.auditService.logEvent({
      action: AuditAction.ADMIN_CONFIG_CHANGE,
      userId: adminUserId,
      result: AuditResult.SUCCESS,
      ipAddress: context?.ip,
      userAgent: context?.userAgent,
      metadata: { seed: true, ...result },
    });

    this.logger.log(`Seed data created by admin ${adminUserId}`);

    return {
      message: ErrorMessages.ADMIN.SEED_COMPLETED,
      data: { ...result, loginInfo },
    };
  }
}
