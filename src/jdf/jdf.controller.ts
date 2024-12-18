import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { JdfService } from './jdf.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

@Controller('jdf')
export class JdfController {
  constructor(private readonly jdfService: JdfService) {}

  @Post('zip')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async jdfZipUpload(@UploadedFile() file: Express.Multer.File) {
    return await this.jdfService.processJdfZip(file);
  }
}
