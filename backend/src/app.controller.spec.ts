import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('AppController', () => {
  let appController: AppController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('getVersion', () => {
    const mockVersionData = {
      version: '1.0.0',
      buildDate: '2024-01-15T10:30:00.000Z',
      commitHash: 'abc123def',
      environment: 'production',
    };

    const mockPackageData = {
      version: '1.0.0',
    };

    beforeEach(() => {
      // Mock path.join to return predictable paths
      mockPath.join.mockImplementation((...args) => args.join('/'));

      // Mock process.env
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    describe('when version.json exists', () => {
      it('should return version data from version.json', () => {
        // Mock fs.existsSync to return true for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return mock version data
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('version.json')) {
            return JSON.stringify(mockVersionData);
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        expect(result).toEqual({
          success: true,
          data: mockVersionData,
        });

        expect(mockFs.existsSync).toHaveBeenCalledWith('src/version.json');
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          'src/version.json',
          'utf8',
        );
      });
    });

    describe('when version.json does not exist', () => {
      it('should return version data from package.json as fallback', () => {
        // Mock fs.existsSync to return false for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return !filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return mock package data
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('package.json')) {
            return JSON.stringify(mockPackageData);
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        expect(result).toEqual({
          success: true,
          data: {
            version: mockPackageData.version,
            buildDate: expect.any(String),
            commitHash: 'unknown',
            environment: 'test',
          },
        });

        expect(mockFs.existsSync).toHaveBeenCalledWith('src/version.json');
        expect(mockFs.readFileSync).toHaveBeenCalledWith(
          'src/../package.json',
          'utf8',
        );
      });

      it('should use development environment when NODE_ENV is not set', () => {
        delete process.env.NODE_ENV;

        // Mock fs.existsSync to return false for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return !filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return mock package data
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('package.json')) {
            return JSON.stringify(mockPackageData);
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        expect(result.data.environment).toBe('development');
      });
    });

    describe('when both version.json and package.json fail', () => {
      it('should return error response with fallback data', () => {
        // Mock fs.existsSync to return false
        mockFs.existsSync.mockReturnValue(false);

        // Mock fs.readFileSync to throw error
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const result = appController.getVersion();

        expect(result).toEqual({
          success: false,
          error: 'Failed to get version information',
          data: {
            version: 'unknown',
            buildDate: expect.any(String),
            commitHash: 'unknown',
            environment: 'test',
          },
        });
      });

      it('should return error response with development environment when NODE_ENV is not set', () => {
        delete process.env.NODE_ENV;

        // Mock fs.existsSync to return false
        mockFs.existsSync.mockReturnValue(false);

        // Mock fs.readFileSync to throw error
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const result = appController.getVersion();

        expect(result.data.environment).toBe('development');
      });
    });

    describe('when version.json exists but is invalid JSON', () => {
      it('should fallback to package.json', () => {
        // Mock fs.existsSync to return true for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return invalid JSON for version.json
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('version.json')) {
            return 'invalid json';
          }
          if (filePath.includes('package.json')) {
            return JSON.stringify(mockPackageData);
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        expect(result).toEqual({
          success: true,
          data: {
            version: mockPackageData.version,
            buildDate: expect.any(String),
            commitHash: 'unknown',
            environment: 'test',
          },
        });
      });
    });

    describe('when package.json is invalid JSON', () => {
      it('should return error response', () => {
        // Mock fs.existsSync to return false for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return !filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return invalid JSON for package.json
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('package.json')) {
            return 'invalid json';
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        expect(result).toEqual({
          success: false,
          error: 'Failed to get version information',
          data: {
            version: 'unknown',
            buildDate: expect.any(String),
            commitHash: 'unknown',
            environment: 'test',
          },
        });
      });
    });

    describe('buildDate format', () => {
      it('should return ISO string format', () => {
        // Mock fs.existsSync to return false for version.json
        mockFs.existsSync.mockImplementation((filePath: string) => {
          return !filePath.includes('version.json');
        });

        // Mock fs.readFileSync to return mock package data
        mockFs.readFileSync.mockImplementation((filePath: string) => {
          if (filePath.includes('package.json')) {
            return JSON.stringify(mockPackageData);
          }
          throw new Error('File not found');
        });

        const result = appController.getVersion();

        // Check if buildDate is a valid ISO string
        expect(result.data.buildDate).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });
    });
  });
});
