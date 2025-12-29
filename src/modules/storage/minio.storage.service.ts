import { ConfigService } from '@nestjs/config'; // TODO: Implementar Audit y logger correctamente - Audit-Actions.enum.ts y error-mmessages.constant.ts
import {
  Injectable,
  OnModuleInit,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client } from 'minio';
import * as path from 'path';
import { StorageProvider } from './Interface/storage.interface';

@Injectable()
export class MinioStorageService implements OnModuleInit, StorageProvider {
  private client: Client;
  private readonly logger = new Logger(MinioStorageService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new Client({
      endPoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT')!,
      port: Number(this.configService.get<string>('MINIO_PORT')),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY')!,
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY')!,
    });
  }

  async upload(params): Promise<string> {
    const { bucket, folder, filename, buffer, mimetype } = params;
    const safeFilename = filename.replace(/\s+/g, '_');
    const objectName = path.posix.join(folder, safeFilename);

    try {
      await this.client.putObject(bucket, objectName, buffer, buffer.length, {
        'Content-Type': mimetype,
      });

      const host = this.configService.getOrThrow('MINIO_PUBLIC_URL');
      return `${host}/${bucket}/${objectName}`;
    } catch (error) {
      this.logger.error(error.message, error.stack);
      throw new InternalServerErrorException('Error al subir el archivo');
    }
  }
}
