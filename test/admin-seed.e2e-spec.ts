import request from 'supertest';
import { truncateAllTables } from './helpers/db';
import { RolUsuarioEnum } from '../src/modules/auth/Enum';
import { createTestApp, TestAppContext } from './helpers/app';
import { buildUserSeed, loginUser, registerUser, setUserRole } from './helpers/auth';

const hasTestDb = Boolean(process.env.TEST_DB_HOST);
const describeFlow = hasTestDb ? describe : describe.skip;

describeFlow('Admin seed flow (e2e)', () => {
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

  it('runs admin seed endpoint', async () => {
    const seed = buildUserSeed('se', {
      nombre: 'Seed',
      apellido: 'Admin',
      celular: '0980000000',
    });

    await registerUser(ctx.app, seed);
    await setUserRole(ctx.dataSource, seed.email, RolUsuarioEnum.ADMIN, true);

    const adminToken = await loginUser(ctx.app, seed.email, seed.password);

    const response = await request(ctx.app.getHttpServer())
      .post('/api/admin/seed')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);

    expect(response.body?.success).toBe(true);
  });
});
