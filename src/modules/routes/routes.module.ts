import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoutesController } from './routes.controller';
import { RoutesService } from './routes.service';
import { Route } from './Models/route.entity';
import { RouteStop } from './Models/route-stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Route, RouteStop])],
  controllers: [RoutesController],
  providers: [RoutesService],
  exports: [TypeOrmModule],
})
export class RoutesModule {}
