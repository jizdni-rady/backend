import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty()
  lat: number;
  @ApiProperty()
  lon: number;
}
