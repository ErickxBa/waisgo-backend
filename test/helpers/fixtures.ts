import { DataSource } from 'typeorm';
import { BusinessUser } from '../../src/modules/business/Models/business-user.entity';
import { Driver } from '../../src/modules/drivers/Models/driver.entity';
import { Vehicle } from '../../src/modules/drivers/Models/vehicle.entity';
import { Route } from '../../src/modules/routes/Models/route.entity';
import { Booking } from '../../src/modules/bookings/Models/booking.entity';
import { Payment } from '../../src/modules/payments/Models/payment.entity';
import { EstadoConductorEnum } from '../../src/modules/drivers/Enums/estado-conductor.enum';
import { CampusOrigenEnum, EstadoRutaEnum } from '../../src/modules/routes/Enums';
import { EstadoReservaEnum } from '../../src/modules/bookings/Enums';
import { MetodoPagoEnum, EstadoPagoEnum } from '../../src/modules/payments/Enums';
import { generatePublicId } from '../../src/modules/common/utils/public-id.util';

export const getBusinessUserByEmail = async (
  dataSource: DataSource,
  email: string,
): Promise<BusinessUser | null> => {
  return dataSource
    .getRepository(BusinessUser)
    .findOne({ where: { email } });
};

export const createBusinessUser = async (
  dataSource: DataSource,
  params: {
    id: string;
    email: string;
    alias?: string;
  },
): Promise<BusinessUser> => {
  const repo = dataSource.getRepository(BusinessUser);
  const businessUser = repo.create({
    id: params.id,
    publicId: await generatePublicId(repo, 'USR'),
    email: params.email,
    alias: params.alias ?? params.email.split('@')[0]?.slice(0, 20),
  });
  return repo.save(businessUser);
};

export const createDriver = async (
  dataSource: DataSource,
  params: {
    userId: string;
    paypalEmail?: string;
    estado?: EstadoConductorEnum;
    fechaAprobacion?: Date | null;
  },
): Promise<Driver> => {
  const repo = dataSource.getRepository(Driver);
  const estado = params.estado ?? EstadoConductorEnum.APROBADO;
  const driver = repo.create({
    publicId: await generatePublicId(repo, 'DRV'),
    userId: params.userId,
    paypalEmail: params.paypalEmail ?? 'driver@epn.edu.ec',
    estado,
    fechaAprobacion:
      params.fechaAprobacion ??
      (estado === EstadoConductorEnum.APROBADO ? new Date() : null),
  });
  return repo.save(driver);
};

export const createVehicle = async (
  dataSource: DataSource,
  params: {
    driverId: string;
    placa: string;
    marca?: string;
    modelo?: string;
    color?: string;
    asientosDisponibles?: number;
    isActivo?: boolean;
  },
): Promise<Vehicle> => {
  const repo = dataSource.getRepository(Vehicle);
  const vehicle = repo.create({
    publicId: await generatePublicId(repo, 'VEH'),
    driverId: params.driverId,
    marca: params.marca ?? 'Toyota',
    modelo: params.modelo ?? 'Yaris',
    color: params.color ?? 'Azul',
    placa: params.placa,
    asientosDisponibles: params.asientosDisponibles ?? 4,
    isActivo: params.isActivo ?? true,
  });
  return repo.save(vehicle);
};

export const createRoute = async (
  dataSource: DataSource,
  params: {
    driverId: string;
    origen?: CampusOrigenEnum;
    fecha?: string;
    horaSalida?: string;
    destinoBase?: string;
    asientosTotales?: number;
    asientosDisponibles?: number;
    precioPasajero?: number;
    estado?: EstadoRutaEnum;
  },
): Promise<Route> => {
  const repo = dataSource.getRepository(Route);
  const asientosTotales = params.asientosTotales ?? 2;
  const asientosDisponibles = params.asientosDisponibles ?? asientosTotales;
  const route = repo.create({
    publicId: await generatePublicId(repo, 'RTE'),
    driverId: params.driverId,
    origen: params.origen ?? CampusOrigenEnum.CAMPUS_PRINCIPAL,
    fecha: params.fecha ?? '2030-02-01',
    horaSalida: params.horaSalida ?? '08:00',
    destinoBase: params.destinoBase ?? 'Destino',
    asientosTotales,
    asientosDisponibles,
    precioPasajero: params.precioPasajero ?? 2.5,
    estado: params.estado ?? EstadoRutaEnum.ACTIVA,
  });
  return repo.save(route);
};

export const createBooking = async (
  dataSource: DataSource,
  params: {
    routeId: string;
    passengerId: string;
    estado?: EstadoReservaEnum;
    otp?: string;
    otpUsado?: boolean;
    metodoPago?: MetodoPagoEnum;
  },
): Promise<Booking> => {
  const repo = dataSource.getRepository(Booking);
  const booking = repo.create({
    publicId: await generatePublicId(repo, 'BKG'),
    routeId: params.routeId,
    passengerId: params.passengerId,
    estado: params.estado ?? EstadoReservaEnum.CONFIRMADA,
    otp: params.otp ?? '123456',
    otpUsado: params.otpUsado ?? false,
    metodoPago: params.metodoPago ?? MetodoPagoEnum.EFECTIVO,
  });
  return repo.save(booking);
};

export const createPayment = async (
  dataSource: DataSource,
  params: {
    bookingId: string;
    amount: number;
    currency?: string;
    method?: MetodoPagoEnum;
    status?: EstadoPagoEnum;
    paidAt?: Date | null;
  },
): Promise<Payment> => {
  const repo = dataSource.getRepository(Payment);
  const payment = repo.create({
    publicId: await generatePublicId(repo, 'PAY'),
    bookingId: params.bookingId,
    amount: params.amount,
    currency: params.currency ?? 'USD',
    method: params.method ?? MetodoPagoEnum.EFECTIVO,
    status: params.status ?? EstadoPagoEnum.PENDING,
    paidAt: params.paidAt ?? null,
  });
  return repo.save(payment);
};
