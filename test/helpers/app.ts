import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '../../src/app.module';
import { RedisService } from '../../src/redis/redis.service';
import { MailService } from '../../src/modules/mail/mail.service';
import { ResponseInterceptor } from '../../src/modules/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../../src/modules/common/filters/global-exception.filter';
import { AuditService } from '../../src/modules/audit/audit.service';
import { InMemoryRedisService, NoopMailService } from './fakes';

type ProviderOverride = {
  provide: unknown;
  useValue: unknown;
};

type CreateTestAppOptions = {
  overrides?: ProviderOverride[];
  useHttpDefaults?: boolean;
};

export type TestAppContext = {
  app: INestApplication;
  dataSource: DataSource;
  redis: InMemoryRedisService;
};

export const createTestApp = async (
  options: CreateTestAppOptions = {},
): Promise<TestAppContext> => {
  const redis = new InMemoryRedisService();

  let builder = Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(RedisService)
    .useValue(redis)
    .overrideProvider(MailService)
    .useValue(new NoopMailService());

  if (options.overrides) {
    options.overrides.forEach((override) => {
      builder = builder.overrideProvider(override.provide).useValue(
        override.useValue,
      );
    });
  }

  const moduleFixture = await builder.compile();

  const app = moduleFixture.createNestApplication();
  if (options.useHttpDefaults !== false) {
    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(
      new GlobalExceptionFilter(app.get(AuditService), app.get(ConfigService)),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
  }

  await app.init();

  return {
    app,
    dataSource: app.get(DataSource),
    redis,
  };
};
