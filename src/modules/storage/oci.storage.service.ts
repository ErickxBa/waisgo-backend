import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from './Interface/storage.interface';
import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import * as path from 'path';

@Injectable()
export class OciStorageService implements StorageProvider {
  private client: objectstorage.ObjectStorageClient | null = null;
  private namespace: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  private init() {
    if (this.client) return;

    const provider = new common.ConfigFileAuthenticationDetailsProvider(
      this.configService.getOrThrow('OCI_CONFIG_PATH'),
      this.configService.getOrThrow('OCI_CONFIG_PROFILE'),
    );

    this.client = new objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });

    this.namespace = this.configService.getOrThrow('OCI_NAMESPACE');
  }

  async upload(params): Promise<string> {
    this.init();

    const { bucket, folder, filename, buffer, mimetype } = params;
    const objectName = path.posix.join(folder, filename);

    await this.client!.putObject({
      namespaceName: this.namespace!,
      bucketName: bucket,
      objectName,
      putObjectBody: buffer,
      contentType: mimetype,
    });

    const region = this.configService.getOrThrow('OCI_REGION');
    return `https://objectstorage.${region}.oraclecloud.com/n/${this.namespace}/b/${bucket}/o/${objectName}`;
  }
}
