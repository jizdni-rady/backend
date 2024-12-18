import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class LinesService {
  constructor(private readonly prisma: PrismaService) {}

  async findCarrierLines(carrierId: string) {
    return await this.prisma.carrier.findFirst({
      where: {
        id: parseInt(carrierId, 10),
      },
      relationLoadStrategy: 'join',
      select: {
        id: true,
        name: true,
        website: true,
        Line: {
          select: {
            id: true,
            name: true,
            number: true,
          },
        },
      },
    });
  }

  async findOneById(id: string) {
    return new Error('Method not implemented.');
  }
}
