import * as path from 'path';
import * as fs from 'fs';
import * as csv from '@fast-csv/parse';
import { EOL } from 'os';
import * as iconv from 'iconv-lite';

export interface JdfParseResult {
  version: JdfVersion;
  stations: JdfStation[];
}

interface JdfVersion {
  version: string;
  date: string;
}

interface JdfStation {
  stopNumber: number;
  stopName: string;
  municipalityPart: string | null;
  nearPoint: string | null;
  nearTown: string | null;
  country: string | null;
  firmCode1: number | null;
  firmCode2: number | null;
  firmCode3: number | null;
  firmCode4: number | null;
  firmCode5: number | null;
  firmCode6: number | null;
}

export class JdfParser {
  constructor() {}

  public async parseJdf(rootFolder: string): Promise<JdfParseResult> {
    const version = await this.fetchVersion(rootFolder);
    const stations = await this.fetchStations(rootFolder);
    return { version, stations };
  }

  private async fetchVersion(rootFolder: string): Promise<JdfVersion> {
    const versionData = await this.loadFile(
      path.join(rootFolder, 'VerzeJDF.txt'),
    );

    if (versionData.length === 0) {
      throw new Error('Version file not found');
    }
    const versionRow = versionData[0];

    //ddmmyyyy
    const rawDate = versionRow[4];

    // yyyy-mm-dd
    const correctedDate = `${rawDate.slice(4, 8)}-${rawDate.slice(2, 4)}-${rawDate.slice(0, 2)}`;

    return { version: versionRow[0], date: correctedDate };
  }

  private async fetchStations(rootFolder: string) {
    const stationsData = await this.loadFile(
      path.join(rootFolder, 'Zastavky.txt'),
    );

    if (stationsData.length === 0) {
      return [];
    }

    return stationsData.map(
      (stationRow) =>
        ({
          stopNumber: parseInt(stationRow[0], 10),
          stopName: this.normaliseName(stationRow[1]),
          municipalityPart: this.normaliseName(stationRow[2]),
          nearPoint: this.normaliseName(stationRow[3]),
          nearTown: this.normaliseName(stationRow[4]),
          country: this.normaliseName(stationRow[5]),
          firmCode1: this.parseNumber(stationRow[6]),
          firmCode2: this.parseNumber(stationRow[7]),
          firmCode3: this.parseNumber(stationRow[8]),
          firmCode4: this.parseNumber(stationRow[9]),
          firmCode5: this.parseNumber(stationRow[10]),
          firmCode6: this.parseNumber(stationRow[11]),
        }) satisfies JdfStation,
    );
  }

  private normaliseName(name: string | undefined | null): string | null {
    const trimmed = name?.trim();
    if (trimmed?.length === 0) {
      return null;
    }

    // if . or , in middle without space after, add space
    // example: "Praha,hl.n." -> "Praha, hl.n."
    // TODO: return
    return trimmed.replaceAll(/([.,])(?=\S)/g, '$1 ');
  }

  private async convertAnsiToUtf8(filePath: string): Promise<string> {
    const rawData = await fs.promises.readFile(filePath);

    const content = iconv.decode(rawData, 'win1250');
    return content;
  }

  private parseNumber(value: string): number | null {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? null : parsed;
  }

  private async loadFile(fp: string): Promise<string[][]> {
    const lines = (await this.convertAnsiToUtf8(fp)).split(EOL);

    const normalised = lines.map((line) => {
      if (line.endsWith(';')) {
        return line.slice(0, -1);
      }
      if (line.endsWith(';\r')) {
        return line.slice(0, -2);
      }
      return line;
    });

    const versionParsed = csv.parseString(normalised.join(EOL), {
      delimiter: ',',
    });

    return await new Promise((resolve, reject) => {
      const data: unknown[] = [];

      versionParsed
        .on('data', (row) => {
          data.push(row);
          console.log(`Parsed row: ${JSON.stringify(row)}`);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          /** @ts-expect-error typy pozdeji */
          resolve(data);
        });
    });
  }
}
