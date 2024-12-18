import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { LinesService } from './lines.service';

@Controller('lines')
export class LinesController {
  constructor(private readonly linesService: LinesService) {}

  @Get(':carrierId')
  async get(@Param('carrierId') id: string) {
    const res = await this.linesService.findCarrierLines(id);
    if (res) {
      return res;
    }

    throw new NotFoundException();
  }
}
