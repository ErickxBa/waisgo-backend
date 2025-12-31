import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoutePrice1767212000000 implements MigrationInterface {
  name = 'AddRoutePrice1767212000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business"."routes" ADD "precioPasajero" numeric(10,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business"."routes" DROP COLUMN "precioPasajero"`,
    );
  }
}
