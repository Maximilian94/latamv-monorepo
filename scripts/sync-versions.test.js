const fs = require('fs');
const path = require('path');

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = fs;
const mockPath = path;

// Mock console.log to capture output
const originalConsoleLog = console.log;
let consoleOutput = [];

describe('sync-versions.js', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    consoleOutput = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });

    // Mock path.join
    mockPath.join.mockImplementation((...args) => args.join('/'));

    // Mock process.env
    process.env.GIT_COMMIT_HASH = 'test-commit-hash';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    delete process.env.GIT_COMMIT_HASH;
    delete process.env.NODE_ENV;
  });

  describe('when all files exist', () => {
    it('should sync versions across all packages', () => {
      const mockMainPackage = { version: '1.2.3' };
      const mockFrontendPackage = { name: 'latam-v-fe', version: '0.0.0' };
      const mockBackendPackage = { name: 'latam-virtual-app-be', version: '0.0.1' };

      // Mock fs.readFileSync
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          if (filePath.includes('frontend')) {
            return JSON.stringify(mockFrontendPackage);
          } else if (filePath.includes('backend')) {
            return JSON.stringify(mockBackendPackage);
          } else {
            return JSON.stringify(mockMainPackage);
          }
        }
        throw new Error('File not found');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockReturnValue(true);

      // Mock fs.writeFileSync
      mockFs.writeFileSync.mockImplementation(() => {});

      // Import and run the script
      require('./sync-versions.js');

      // Verify main package.json was read
      expect(mockFs.readFileSync).toHaveBeenCalledWith('package.json', 'utf8');

      // Verify frontend package.json was updated
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'frontend/package.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      // Verify backend package.json was updated
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'backend/package.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      // Verify version.json files were created
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'frontend/public/version.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'backend/src/version.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      // Verify console output
      expect(consoleOutput).toContain('🔄 Syncing version 1.2.3 across all packages...');
      expect(consoleOutput).toContain('✅ Frontend version updated to 1.2.3');
      expect(consoleOutput).toContain('✅ Backend version updated to 1.2.3');
      expect(consoleOutput).toContain('✅ Frontend version.json created');
      expect(consoleOutput).toContain('✅ Backend version.json created');
      expect(consoleOutput).toContain('🎉 Version sync completed! All packages now use version 1.2.3');
    });
  });

  describe('when frontend package.json does not exist', () => {
    it('should skip frontend update and continue', () => {
      const mockMainPackage = { version: '1.2.3' };
      const mockBackendPackage = { name: 'latam-virtual-app-be', version: '0.0.1' };

      // Mock fs.readFileSync
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          if (filePath.includes('backend')) {
            return JSON.stringify(mockBackendPackage);
          } else if (!filePath.includes('frontend')) {
            return JSON.stringify(mockMainPackage);
          }
        }
        throw new Error('File not found');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockImplementation((filePath) => {
        return !filePath.includes('frontend/package.json');
      });

      // Mock fs.writeFileSync
      mockFs.writeFileSync.mockImplementation(() => {});

      // Import and run the script
      require('./sync-versions.js');

      // Verify backend was still updated
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'backend/package.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      // Verify frontend was not updated
      expect(mockFs.writeFileSync).not.toHaveBeenCalledWith(
        'frontend/package.json',
        expect.anything()
      );

      // Verify console output doesn't mention frontend
      expect(consoleOutput).not.toContain('✅ Frontend version updated to 1.2.3');
    });
  });

  describe('when backend package.json does not exist', () => {
    it('should skip backend update and continue', () => {
      const mockMainPackage = { version: '1.2.3' };
      const mockFrontendPackage = { name: 'latam-v-fe', version: '0.0.0' };

      // Mock fs.readFileSync
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json')) {
          if (filePath.includes('frontend')) {
            return JSON.stringify(mockFrontendPackage);
          } else if (!filePath.includes('backend')) {
            return JSON.stringify(mockMainPackage);
          }
        }
        throw new Error('File not found');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockImplementation((filePath) => {
        return !filePath.includes('backend/package.json');
      });

      // Mock fs.writeFileSync
      mockFs.writeFileSync.mockImplementation(() => {});

      // Import and run the script
      require('./sync-versions.js');

      // Verify frontend was still updated
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        'frontend/package.json',
        expect.stringContaining('"version": "1.2.3"')
      );

      // Verify backend was not updated
      expect(mockFs.writeFileSync).not.toHaveBeenCalledWith(
        'backend/package.json',
        expect.anything()
      );

      // Verify console output doesn't mention backend
      expect(consoleOutput).not.toContain('✅ Backend version updated to 1.2.3');
    });
  });

  describe('version.json content', () => {
    it('should create version.json with correct structure', () => {
      const mockMainPackage = { version: '1.2.3' };

      // Mock fs.readFileSync
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json') && !filePath.includes('frontend') && !filePath.includes('backend')) {
          return JSON.stringify(mockMainPackage);
        }
        throw new Error('File not found');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockReturnValue(true);

      // Mock fs.writeFileSync to capture what was written
      let writtenContent = '';
      mockFs.writeFileSync.mockImplementation((filePath, content) => {
        if (filePath.includes('version.json')) {
          writtenContent = content;
        }
      });

      // Import and run the script
      require('./sync-versions.js');

      // Parse the written content
      const versionData = JSON.parse(writtenContent);

      // Verify structure
      expect(versionData).toHaveProperty('version', '1.2.3');
      expect(versionData).toHaveProperty('buildDate');
      expect(versionData).toHaveProperty('commitHash', 'test-commit-hash');
      expect(versionData).toHaveProperty('environment', 'test');

      // Verify buildDate is ISO string
      expect(versionData.buildDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should use default values when environment variables are not set', () => {
      delete process.env.GIT_COMMIT_HASH;
      delete process.env.NODE_ENV;

      const mockMainPackage = { version: '1.2.3' };

      // Mock fs.readFileSync
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.includes('package.json') && !filePath.includes('frontend') && !filePath.includes('backend')) {
          return JSON.stringify(mockMainPackage);
        }
        throw new Error('File not found');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockReturnValue(true);

      // Mock fs.writeFileSync to capture what was written
      let writtenContent = '';
      mockFs.writeFileSync.mockImplementation((filePath, content) => {
        if (filePath.includes('version.json')) {
          writtenContent = content;
        }
      });

      // Import and run the script
      require('./sync-versions.js');

      // Parse the written content
      const versionData = JSON.parse(writtenContent);

      // Verify default values
      expect(versionData.commitHash).toBe('unknown');
      expect(versionData.environment).toBe('development');
    });
  });

  describe('error handling', () => {
    it('should handle JSON parsing errors gracefully', () => {
      // Mock fs.readFileSync to return invalid JSON
      mockFs.readFileSync.mockReturnValue('invalid json');

      // Mock fs.existsSync
      mockFs.existsSync.mockReturnValue(true);

      // Mock fs.writeFileSync
      mockFs.writeFileSync.mockImplementation(() => {});

      // Should not throw error
      expect(() => {
        require('./sync-versions.js');
      }).not.toThrow();
    });

    it('should handle file system errors gracefully', () => {
      // Mock fs.readFileSync to throw error
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      // Mock fs.existsSync
      mockFs.existsSync.mockReturnValue(true);

      // Mock fs.writeFileSync
      mockFs.writeFileSync.mockImplementation(() => {});

      // Should not throw error
      expect(() => {
        require('./sync-versions.js');
      }).not.toThrow();
    });
  });
}); 