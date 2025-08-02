import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('version')
  getVersion() {
    try {
      const versionPath = path.join(__dirname, 'version.json');
      if (fs.existsSync(versionPath)) {
        const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
        return {
          success: true,
          data: versionData,
        };
      }

      // Fallback to package.json if version.json doesn't exist
      const packagePath = path.join(__dirname, '..', '..', 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      return {
        success: true,
        data: {
          version: packageData.version,
          buildDate: new Date().toISOString(),
          commitHash: 'unknown',
          environment: process.env.NODE_ENV || 'development',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get version information',
        data: {
          version: 'unknown',
          buildDate: new Date().toISOString(),
          commitHash: 'unknown',
          environment: process.env.NODE_ENV || 'development',
        },
      };
    }
  }
}
