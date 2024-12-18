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
}
