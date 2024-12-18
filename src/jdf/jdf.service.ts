import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as os from 'os';
import * as iconv from 'iconv-lite';
import * as csv from '@fast-csv/parse';
import type {
  Carrier,
  Line,
  Stop,
  Code,
  Connection,
  StopConnection,
} from '@prisma/client';
import { ValueParser } from 'src/value-parser';

const USE_DEBUG_DIR = true;
const DEBUG_DONT_CLEANUP = true;

@Injectable()
export class JdfService {
  private readonly tempDir: string;
  private readonly logger = new Logger(JdfService.name);

  constructor(private readonly prisma: PrismaService) {
    this.tempDir = path.join(os.tmpdir(), 'jdf');
  }

  async processJdfZip(file: Express.Multer.File) {
    this.logger.log('Processing JDF zip file:', file.originalname);

    const filesDir = await this.saveAndExtractZip(file);

    const carrierId = await this.loadCarrier(filesDir);
    const linesData = await this.loadLinesFile(filesDir, carrierId);
    const stopData = await this.loadStopsFile(filesDir);
    await this.loadCodesFile(filesDir);
    await this.loadConnectionFile(filesDir, linesData);
    await this.loadStopConnectionsFile(filesDir, linesData, stopData);

    // Process the uploaded zip file

    await this.cleanupTempDir(filesDir);
    return { success: true };
  }

  private async loadConnectionFile(
    filePath: string,
    linesData: Awaited<ReturnType<typeof this.loadLinesFile>>,
  ) {
    const connectionFile = path.join(filePath, 'Spoje.txt');
    if (!fs.existsSync(connectionFile)) {
      throw new Error('Connection file not found');
    }

    const parsedFile = await this.loadJdfFile(connectionFile);
    if (parsedFile.length === 0) {
      return [];
    }

    const connectionData: {
      id: number;
      internalId: number;
    }[] = [];

    for await (const row of parsedFile) {
      const lineId =
        linesData.find((x) => x.internalId === parseInt(row[13], 10))?.id ??
        null;
      const connection: Omit<Connection, 'id'> = {
        lineNumber: ValueParser.parseInt(row[0]),
        connectionNumber: ValueParser.parseInt(row[1]),
        code1: ValueParser.parseString(row[2]),
        code2: ValueParser.parseString(row[3]),
        code3: ValueParser.parseString(row[4]),
        code4: ValueParser.parseString(row[5]),
        code5: ValueParser.parseString(row[6]),
        code6: ValueParser.parseString(row[7]),
        code7: ValueParser.parseString(row[8]),
        code8: ValueParser.parseString(row[9]),
        code9: ValueParser.parseString(row[10]),
        code10: ValueParser.parseString(row[11]),
        connectionGroupId: ValueParser.parseInt(row[12]),
        lineId: lineId,
      };

      const existing = await this.prisma.connection.findFirst({
        where: {
          lineNumber: connection.lineNumber,
          connectionNumber: connection.connectionNumber,
        },
      });

      if (existing) {
        await this.prisma.connection.update({
          where: { id: existing.id },
          data: connection,
        });

        connectionData.push({
          id: existing.id,
          internalId: parseInt(row[15], 10),
        });
        continue;
      }

      const created = await this.prisma.connection.create({
        data: connection,
      });
      connectionData.push({
        id: created.id,
        internalId: parseInt(row[15], 10),
      });
    }

    return connectionData;
  }

  private async loadStopConnectionsFile(
    filePath: string,
    linesData: Awaited<ReturnType<typeof this.loadLinesFile>>,
    stopData: Awaited<ReturnType<typeof this.loadStopsFile>>,
  ) {
    const stopConnectionsFile = path.join(filePath, 'Zasspoje.txt');
    if (!fs.existsSync(stopConnectionsFile)) {
      throw new Error('Stop connections file not found');
    }

    const parsedFile = await this.loadJdfFile(stopConnectionsFile);
    if (parsedFile.length === 0) {
      return [];
    }

    const stopConnectionsData: {
      id: number;
      internalId: number;
    }[] = [];

    this.logger.log({ row: parsedFile[0], linesData, stopData });

    for await (const row of parsedFile) {
      const lineId =
        linesData.find((x) => x.internalId === parseInt(row[11], 10))?.id ??
        null;

      const stopId =
        stopData.find((x) => x.internalId === parseInt(row[3], 10))?.id ?? null;

      const stopConnection: Omit<
        StopConnection,
        'id' | 'departureTime' | 'arrivalTime'
      > = {
        lineNumber: ValueParser.parseInt(row[0]),
        connectionNumber: ValueParser.parseInt(row[1]),
        tariffNumber: ValueParser.parseInt(row[2]),
        stopNumber: ValueParser.parseInt(row[3]),
        markerCode: ValueParser.parseString(row[4]),
        stationNumber: ValueParser.parseString(row[5]),
        code1: ValueParser.parseString(row[6]),
        code2: ValueParser.parseString(row[7]),
        kilometers: ValueParser.parseFloat(row[8]),
        arrival: ValueParser.parseString(row[9]),
        departure: ValueParser.parseString(row[10]),

        //
        lineId,
        stopId,
      };

      const existing = await this.prisma.stopConnection.findFirst({
        where: {
          lineNumber: stopConnection.lineNumber,
          connectionNumber: stopConnection.connectionNumber,
          stopNumber: stopConnection.stopNumber,
        },
      });

      if (existing) {
        await this.prisma.stopConnection.update({
          where: { id: existing.id },
          data: stopConnection,
        });

        stopConnectionsData.push({
          id: existing.id,
          internalId: parseInt(row[12], 10),
        });
        continue;
      }

      const created = await this.prisma.stopConnection.create({
        data: stopConnection,
      });
      stopConnectionsData.push({
        id: created.id,
        internalId: parseInt(row[12], 10),
      });
    }

    return stopConnectionsData;
  }

  private async loadCarrier(filePath: string): Promise<number> {
    const carrierFile = path.join(filePath, 'Dopravci.txt');
    if (!fs.existsSync(carrierFile)) {
      throw new Error('Carrier file not found');
    }

    const parsedFile = await this.loadJdfFile(carrierFile);

    if (parsedFile.length !== 1) {
      throw new Error('Invalid carrier file format');
    }

    const row = parsedFile[0];

    const carrier: Omit<Carrier, 'id'> = {
      ico: row[0],
      dic: row[1],
      name: row[2],
      firmType: row[3],
      personName: row[4],
      address: row[5],
      phone: row[6],
      dispatchPhone: row[7],
      infoPhone: row[8],
      fax: row[9],
      email: row[10],
      website: row[11],
    };

    const existing = await this.prisma.carrier.findFirst({
      where: { ico: carrier.ico },
    });

    if (existing) {
      await this.prisma.carrier.update({
        where: { id: existing.id },
        data: carrier,
      });
      return existing.id;
    }

    const newRow = await this.prisma.carrier.create({
      data: carrier,
    });
    return newRow.id;
  }

  private async loadStopsFile(basePath: string) {
    const stopsFile = path.join(basePath, 'Zastavky.txt');
    if (!fs.existsSync(stopsFile)) {
      throw new Error('Stops file not found');
    }

    const parsedFile = await this.loadJdfFile(stopsFile);

    if (parsedFile.length === 0) {
      throw new Error('Invalid stops file format');
    }

    const stopData: {
      id: number;
      internalId: number;
    }[] = [];

    this.logger.log({ stop: parsedFile[0] });
    for await (const row of parsedFile) {
      const stop: Omit<Stop, 'id' | 'lat' | 'lon' | 'duplicateRootId'> = {
        number: ValueParser.parseInt(row[0]),
        name: ValueParser.parseString(row[1]),
        district: ValueParser.parseString(row[2]),
        nearPoint: ValueParser.parseString(row[3]),
        nearCity: ValueParser.parseString(row[4]),
        country: ValueParser.parseString(row[5]),
        nameNormalized: ValueParser.normaliseName(row[1]),
      };

      const existing = await this.prisma.stop.findFirst({
        where: { name: stop.name }, // because the format is fucked
      });

      if (existing) {
        await this.prisma.stop.update({
          where: { id: existing.id },
          data: stop,
        });
        stopData.push({ id: existing.id, internalId: parseInt(row[0], 10) });
      } else {
        const created = await this.prisma.stop.create({
          data: stop,
        });

        stopData.push({ id: created.id, internalId: parseInt(row[0], 10) });
      }
    }

    return stopData;
  }

  private async loadCodesFile(filePath: string) {
    const codesFile = path.join(filePath, 'Pevnykod.txt');
    if (!fs.existsSync(codesFile)) {
      throw new Error('Codes file not found');
    }

    const parsedFile = await this.loadJdfFile(codesFile);

    const codesData: { id: number; internalId: number }[] = [];

    for await (const row of parsedFile) {
      const code: Omit<Code, 'id'> = {
        internalCode: row[0],
        code: row[1],
        internal: row[2],
      };

      const existing = await this.prisma.code.findFirst({
        where: { internalCode: code.internalCode },
      });
      if (existing) {
        await this.prisma.code.update({
          where: { id: existing.id },
          data: code,
        });
        codesData.push({ id: existing.id, internalId: parseInt(row[0], 10) });

        continue;
      }
      const created = await this.prisma.code.create({
        data: code,
      });
      codesData.push({ id: created.id, internalId: parseInt(row[0], 10) });
    }

    return codesData;
  }

  private async loadJdfFile(filePath: string): Promise<string[][]> {
    const fileContent = this.readWin1250File(filePath);
    return await this.parseCsv(fileContent);
  }

  private readWin1250File(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return iconv.decode(buffer, 'win1250').trim();
  }

  private async parseCsv(content: string): Promise<string[][]> {
    const parsedRows: string[][] = [];

    return await new Promise((resolve, reject) => {
      csv
        .parseString(content.replace(/;(\r\n)?/g, '\n'), {
          headers: false,
          delimiter: ',',
          quote: '"',
          trim: true,
        })
        .on('data', (row) => {
          parsedRows.push(row);
        })
        .on('end', () => {
          resolve(parsedRows);
        })
        .on('error', (error) => {
          reject(new Error(`Error parsing CSV: ${error}`));
        });
    });
  }

  private async cleanupTempDir(tempDir: string) {
    if (DEBUG_DONT_CLEANUP) {
      this.logger.log('Simulating cleanup', tempDir);
      return;
    }

    try {
      await fs.promises.rmdir(tempDir, { recursive: true });
      this.logger.log(`Deleted temp dir: ${tempDir}`);
    } catch (error) {
      this.logger.error(`Failed to delete temp dir: ${error.message}`);
    }
  }

  private async loadLinesFile(basePath: string, carrierId: number) {
    const linesFile = path.join(basePath, 'Linky.txt');
    if (!fs.existsSync(linesFile)) {
      throw new Error('Lines file not found');
    }

    const parsedFile = await this.loadJdfFile(linesFile);

    const linesData: {
      id: number;
      internalId: number;
    }[] = [];

    for await (const row of parsedFile) {
      const lineData: Omit<Line, 'id'> = {
        number: row[0],
        name: row[1],
        icoCarrier: row[2],
        lineType: row[3],
        vehicleType: row[4],
        isDetour: row[5] === '1',
        isGrouped: row[6] === '1',
        isCoded: row[7] === '1',
        reserve: row[8],
        license: row[9],
        licenseValidFrom: this.stringToDateOrNull(row[10]),
        licenseValidTo: this.stringToDateOrNull(row[11]),
        scheduleValidFrom: this.stringToDateOrNull(row[12]),
        scheduleValidTo: this.stringToDateOrNull(row[13]),

        carrierId,
      };

      const existing = await this.prisma.line.findFirst({
        where: { number: lineData.number, icoCarrier: lineData.icoCarrier },
      });

      if (existing) {
        await this.prisma.line.update({
          where: { id: existing.id },
          data: lineData,
        });

        linesData.push({ id: existing.id, internalId: parseInt(row[15], 10) });
      } else {
        const created = await this.prisma.line.create({
          data: lineData,
        });

        linesData.push({ id: created.id, internalId: parseInt(row[15], 10) });
      }
    }

    return linesData;
  }

  private stringToDateOrNull(
    dateString: string | null | undefined,
  ): Date | null {
    dateString = dateString?.trim();
    if (!dateString || dateString === '') {
      return null;
    }
    //ddmmyyyy -> yyyy-mm-dd
    const formatted = `${dateString.slice(4, 8)}-${dateString.slice(
      2,
      4,
    )}-${dateString.slice(0, 2)}`;

    try {
      return dateString ? new Date(formatted) : null;
    } catch {
      this.logger.error(`Failed to parse date: ${dateString}`);
      return null;
    }
  }

  private async saveAndExtractZip(file: Express.Multer.File): Promise<string> {
    // Ensure the temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    const timestamp = new Date().getTime();

    const tempDir = USE_DEBUG_DIR
      ? path.join(this.tempDir, 'jdf-debug')
      : path.join(
          this.tempDir,
          `jdf_${timestamp}_${file.originalname.replace(/\.[^.]+$/, '')}`,
        );

    const origPath = path.join(tempDir, file.originalname);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    //save original file
    try {
      await fs.promises.writeFile(origPath, file.buffer);
      this.logger.log(`Saved ${file.originalname} to ${origPath}`);
    } catch (error) {
      throw new Error(`Failed to save zip file: ${error.message}`);
    }

    try {
      await fs
        .createReadStream(origPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .promise();
      return tempDir;
    } catch (error) {
      throw new Error(`Failed to extract zip file: ${error.message}`);
    }
  }
}
