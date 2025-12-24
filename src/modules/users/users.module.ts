import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './Models/users.entity';
import { Credential } from './Models/credentials.entity';
import { CleanupUnverifiedUsersJob } from './jobs/cleanup-unverified-users.job';

@Module({
  providers: [UsersService, CleanupUnverifiedUsersJob],
  controllers: [UsersController],
  exports: [UsersService],
  imports: [TypeOrmModule.forFeature([User, Credential])],
})
export class UsersModule {}
