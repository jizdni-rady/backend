import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class StopsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getStops() {
    return await this.prismaService.stop.findMany({
      select: {
        id: true,
        name: true,
        lat: true,
        lon: true,
      },
    });
  }

  async getStopById(id: number) {
    return await this.prismaService.stop.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        nameNormalized: true,
        lat: true,
        lon: true,
        StopConnection: {
          select: {
            id: true,
            arrival: true,
            departure: true,
            line: {
              select: { id: true, name: true, number: true },
            },
          },
        },
      },
      relationLoadStrategy: 'join',
    });
  }

  async updateStopLatLon(id: number, lat: number, lon: number) {
    return await this.prismaService
      .$executeRaw`UPDATE "Stop" SET "coords" = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326) WHERE "id" = ${id};`;
  }

  async getNearestStops(lat: number, lon: number, limit?: number) {
    return await this.prismaService.$queryRaw`
      SELECT
        "id",
        "name",
        ST_Distance(coords, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)) AS distance
      FROM "Stop"
      ORDER BY distance
      LIMIT ${limit || 5}`;
  }
}
