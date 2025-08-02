import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and path for e2e tests
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((...args) => args.join('/'));
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  describe('/version (GET)', () => {
    const mockVersionData = {
      version: '1.0.0',
      buildDate: '2024-01-15T10:30:00.000Z',
      commitHash: 'abc123def',
      environment: 'test',
    };

    const mockPackageData = {
      version: '1.0.0',
    };

    beforeEach(() => {
      // Mock process.env
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    describe('when version.json exists', () => {
      it('should return version data from version.json', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        expect(response.body).toEqual({
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
      it('should return version data from package.json as fallback', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        expect(response.body).toEqual({
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

      it('should use development environment when NODE_ENV is not set', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        expect(response.body.data.environment).toBe('development');
      });
    });

    describe('when both version.json and package.json fail', () => {
      it('should return error response with fallback data', async () => {
        // Mock fs.existsSync to return false
        mockFs.existsSync.mockReturnValue(false);

        // Mock fs.readFileSync to throw error
        mockFs.readFileSync.mockImplementation(() => {
          throw new Error('File system error');
        });

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        expect(response.body).toEqual({
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

    describe('when version.json exists but is invalid JSON', () => {
      it('should fallback to package.json', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        expect(response.body).toEqual({
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

    describe('response format validation', () => {
      it('should return valid JSON structure', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        // Validate response structure
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('version');
        expect(response.body.data).toHaveProperty('buildDate');
        expect(response.body.data).toHaveProperty('commitHash');
        expect(response.body.data).toHaveProperty('environment');

        // Validate data types
        expect(typeof response.body.success).toBe('boolean');
        expect(typeof response.body.data.version).toBe('string');
        expect(typeof response.body.data.buildDate).toBe('string');
        expect(typeof response.body.data.commitHash).toBe('string');
        expect(typeof response.body.data.environment).toBe('string');
      });

      it('should return ISO string format for buildDate', async () => {
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

        const response = await request(app.getHttpServer())
          .get('/version')
          .expect(200);

        // Check if buildDate is a valid ISO string
        expect(response.body.data.buildDate).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
      });
    });
  });
});
