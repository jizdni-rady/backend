import { Module } from '@nestjs/common';
import { JdfService } from './jdf.service';
import { JdfController } from './jdf.controller';
import { PrismaService } from 'src/prisma.service';

@Module({
  imports: [],
  controllers: [JdfController],
  providers: [JdfService, PrismaService],
})
export class JdfModule {}
