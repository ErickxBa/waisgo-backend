import { truncateAllTables } from './helpers/db';
import { AuthUser } from '../src/modules/auth/Models/auth-user.entity';
import { EstadoVerificacionEnum, RolUsuarioEnum } from '../src/modules/auth/Enum';
import { createTestApp, TestAppContext } from './helpers/app';
import {
  buildUserSeed,
  loginUser,
  registerUser,
  verifyUser,
} from './helpers/auth';

const hasTestDb = Boolean(process.env.TEST_DB_HOST);
const describeAuth = hasTestDb ? describe : describe.skip;

describeAuth('Auth flow (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(async () => {
    await truncateAllTables(ctx.dataSource);
    ctx.redis.clear();
  });

  it('registers, logs in, and verifies a user', async () => {
    const seed = buildUserSeed('t', {
      nombre: 'Juan',
      apellido: 'Perez',
      celular: '0987654321',
    });

    await registerUser(ctx.app, seed);

    const token = await loginUser(ctx.app, seed.email, seed.password);
    expect(token).toBeDefined();

    await verifyUser(ctx.app, ctx.dataSource, ctx.redis, seed.email, token);

    const authRepo = ctx.dataSource.getRepository(AuthUser);
    const verifiedUser = await authRepo.findOne({
      where: { email: seed.email },
    });
    expect(verifiedUser?.estadoVerificacion).toBe(
      EstadoVerificacionEnum.VERIFICADO,
    );
    expect(verifiedUser?.rol).toBe(RolUsuarioEnum.PASAJERO);
  });
});
