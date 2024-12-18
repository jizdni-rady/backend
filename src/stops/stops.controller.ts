import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { StopsService } from './stops.service';
import { UpdateLocationDto } from './models';
import { ApiQuery } from '@nestjs/swagger';

@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  @Get('detail/:id')
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

  @Get('nearest')
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The number of stops to return',
  })
  @ApiQuery({
    name: 'lat',
    required: true,
    type: Number,
    description: 'The latitude of the location',
  })
  @ApiQuery({
    name: 'lon',
    required: true,
    type: Number,
    description: 'The longitude of the location',
  })
  async getNearestStops(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('limit') limit?: string,
  ) {
    const numericLat = parseFloat(lat);
    const numericLon = parseFloat(lon);
    const numericLimit = parseInt(limit, 10);

    if (isNaN(numericLat) || isNaN(numericLon) || isNaN(numericLimit)) {
      throw new BadRequestException('Invalid lat, lon, or limit');
    }

    try {
      return await this.stopsService.getNearestStops(
        numericLat,
        numericLon,
        numericLimit,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Patch('gps/:id')
  async updateStopLatLon(
    @Param('id') id: string,
    @Body() body: UpdateLocationDto,
  ) {
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      throw new BadRequestException(`Invalid id ${id}`);
    }

    if (isNaN(body.lat) || isNaN(body.lon)) {
      throw new BadRequestException('Invalid lat or lon');
    }

    try {
      return await this.stopsService.updateStopLatLon(
        numericId,
        body.lat,
        body.lon,
      );
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }
}
