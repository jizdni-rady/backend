import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LinesModule } from './lines/lines.module';
import { PrismaService } from './prisma.service';
import { JdfModule } from './jdf/jdf.module';
import { StopsModule } from './stops/stops.module';

@Module({
  imports: [LinesModule, JdfModule, StopsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
