import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { RedisService } from '../src/redis/redis.service';
import { MailService } from '../src/modules/mail/mail.service';
import { InMemoryRedisService, NoopMailService } from './helpers/fakes';
import { truncateAllTables } from './helpers/db';
import { RoutesService } from '../src/modules/routes/routes.service';
import { BusinessUser } from '../src/modules/business/Models/business-user.entity';
import { Driver } from '../src/modules/drivers/Models/driver.entity';
import { Route } from '../src/modules/routes/Models/route.entity';
import { EstadoConductorEnum } from '../src/modules/drivers/Enums/estado-conductor.enum';
import { CampusOrigenEnum, EstadoRutaEnum } from '../src/modules/routes/Enums';
import { generatePublicId } from '../src/modules/common/utils/public-id.util';

const hasTestDb = Boolean(process.env.TEST_DB_HOST);
const describeRoutes = hasTestDb ? describe : describe.skip;

describeRoutes('Routes auto-finalize (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let routesService: RoutesService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RedisService)
      .useValue(new InMemoryRedisService())
      .overrideProvider(MailService)
      .useValue(new NoopMailService())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    routesService = app.get(RoutesService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(dataSource);
  });

  it('finalizes expired routes without pending bookings', async () => {
    const businessRepo = dataSource.getRepository(BusinessUser);
    const driverRepo = dataSource.getRepository(Driver);
    const routeRepo = dataSource.getRepository(Route);

    const driverUser = businessRepo.create({
      id: '11111111-2222-3333-4444-555555555555',
      publicId: await generatePublicId(businessRepo, 'USR'),
      email: `driver${Date.now()}@epn.edu.ec`,
      alias: `driver${Date.now()}`.slice(0, 20),
    });
    await businessRepo.save(driverUser);

    const driver = driverRepo.create({
      publicId: await generatePublicId(driverRepo, 'DRV'),
      userId: driverUser.id,
      paypalEmail: 'driver@epn.edu.ec',
      estado: EstadoConductorEnum.APROBADO,
      fechaAprobacion: new Date(),
    });
    await driverRepo.save(driver);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dateString = yesterday.toISOString().slice(0, 10);

    const route = routeRepo.create({
      publicId: await generatePublicId(routeRepo, 'RTE'),
      driverId: driver.id,
      origen: CampusOrigenEnum.CAMPUS_PRINCIPAL,
      fecha: dateString,
      horaSalida: '00:05',
      destinoBase: 'Destino',
      asientosTotales: 2,
      asientosDisponibles: 2,
      precioPasajero: 2.5,
      estado: EstadoRutaEnum.ACTIVA,
    });
    await routeRepo.save(route);

    await routesService.autoFinalizeExpiredRoutes();

    const updated = await routeRepo.findOne({ where: { id: route.id } });
    expect(updated?.estado).toBe(EstadoRutaEnum.FINALIZADA);
  });
});
