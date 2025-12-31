import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicIds1769005130000 implements MigrationInterface {
  name = 'AddPublicIds1769005130000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business"."business_users" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."drivers" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."driver_documents" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."vehicles" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."route_stops" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."routes" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."bookings" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payments" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payouts" ADD "publicId" character varying(12)`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."ratings" ADD "publicId" character varying(12)`,
    );

    await queryRunner.query(
      `UPDATE "business"."business_users" SET "publicId" = 'USR_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."drivers" SET "publicId" = 'DRV_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."driver_documents" SET "publicId" = 'DOC_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."vehicles" SET "publicId" = 'VEH_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."route_stops" SET "publicId" = 'STP_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."routes" SET "publicId" = 'RTE_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."bookings" SET "publicId" = 'BKG_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."payments" SET "publicId" = 'PAY_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."payouts" SET "publicId" = 'PYO_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );
    await queryRunner.query(
      `UPDATE "business"."ratings" SET "publicId" = 'RAT_' || upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)) WHERE "publicId" IS NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "business"."business_users" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."drivers" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."driver_documents" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."vehicles" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."route_stops" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."routes" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."bookings" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payments" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payouts" ALTER COLUMN "publicId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."ratings" ALTER COLUMN "publicId" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "business"."business_users" ADD CONSTRAINT "UQ_business_users_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."drivers" ADD CONSTRAINT "UQ_drivers_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."driver_documents" ADD CONSTRAINT "UQ_driver_documents_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."vehicles" ADD CONSTRAINT "UQ_vehicles_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."route_stops" ADD CONSTRAINT "UQ_route_stops_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."routes" ADD CONSTRAINT "UQ_routes_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."bookings" ADD CONSTRAINT "UQ_bookings_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payments" ADD CONSTRAINT "UQ_payments_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payouts" ADD CONSTRAINT "UQ_payouts_public_id" UNIQUE ("publicId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."ratings" ADD CONSTRAINT "UQ_ratings_public_id" UNIQUE ("publicId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "business"."ratings" DROP CONSTRAINT "UQ_ratings_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payouts" DROP CONSTRAINT "UQ_payouts_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payments" DROP CONSTRAINT "UQ_payments_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."bookings" DROP CONSTRAINT "UQ_bookings_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."routes" DROP CONSTRAINT "UQ_routes_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."route_stops" DROP CONSTRAINT "UQ_route_stops_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."vehicles" DROP CONSTRAINT "UQ_vehicles_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."driver_documents" DROP CONSTRAINT "UQ_driver_documents_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."drivers" DROP CONSTRAINT "UQ_drivers_public_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."business_users" DROP CONSTRAINT "UQ_business_users_public_id"`,
    );

    await queryRunner.query(
      `ALTER TABLE "business"."ratings" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payouts" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."payments" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."bookings" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."routes" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."route_stops" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."vehicles" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."driver_documents" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."drivers" DROP COLUMN "publicId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "business"."business_users" DROP COLUMN "publicId"`,
    );
  }
}
