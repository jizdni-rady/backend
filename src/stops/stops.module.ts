import { Module } from '@nestjs/common';
import { StopsService } from './stops.service';
import { StopsController } from './stops.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [StopsService, PrismaService],
  controllers: [StopsController],
})
export class StopsModule {}
