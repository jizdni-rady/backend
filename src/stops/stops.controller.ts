import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { StopsService } from './stops.service';

@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get(':id')
  async getStop(@Param('id') id: string) {
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new BadRequestException(`Invalid id ${id}`);
    }

    const res = await this.stopsService.getStopById(numericId);
    if (!res) {
      throw new NotFoundException(`Stop with id ${id} not found`);
    }
    return res;
  }

  @Get()
  async getStops() {
    return await this.stopsService.getStops();
  }
}
