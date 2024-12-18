import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { JdfParser } from './jdf.parser';

@Injectable()
export class AppService {
  // async getHello() {
  //   const baseFolder = path.resolve('D:/temp');
  //   const jdfParser = new JdfParser();
  //   const data = await jdfParser.parseJdf(baseFolder);
  //   return data;
  // }
}
