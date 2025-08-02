import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          in: [
            'test@example.com',
            'test2@example.com',
            'different@example.com',
          ],
        },
      },
    });
    await prismaService.user.deleteMany({
      where: {
        username: {
          in: ['joao123', 'joao456'],
        },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const getRegisterData = (suffix: string) => ({
      firstName: 'João',
      lastName: 'Silva',
      email: `test${suffix}@example.com`,
      username: `joao${suffix}`,
      password: 'senha123456',
      baseId: 1,
    });

    it('should create a user and automatically assign Pilot role', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('1'))
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('authToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('name', 'João Silva');
      expect(response.body.user).toHaveProperty('email', 'test1@example.com');
      expect(response.body.user).toHaveProperty('username', 'joao1');
      expect(response.body.user).toHaveProperty('plan', 'FREE');
      expect(response.body.user).toHaveProperty('baseId', 1);

      // Verify that the user has the Pilot role in the database
      const userWithRoles = await prismaService.user.findUnique({
        where: { id: response.body.user.id },
        include: {
          roles: true,
        },
      });

      expect(userWithRoles).toBeDefined();
      expect(userWithRoles.roles).toHaveLength(1);
      expect(userWithRoles.roles[0].name).toBe('Pilot');
    });

    it('should return user with roles included in response', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('2'))
        .expect(201);

      // Assert
      expect(response.body.user).toHaveProperty('roles');
      expect(response.body.user.roles).toBeInstanceOf(Array);
      expect(response.body.user.roles).toHaveLength(1);
      expect(response.body.user.roles[0]).toHaveProperty('id');
      expect(response.body.user.roles[0]).toHaveProperty('name', 'Pilot');
    });

    it('should hash the password before storing', async () => {
      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('3'))
        .expect(201);

      // Assert
      const userInDb = await prismaService.user.findUnique({
        where: { id: response.body.user.id },
        select: { password: true },
      });

      expect(userInDb.password).not.toBe('senha123456');
      expect(userInDb.password).toMatch(
        /^\$2[aby]\$\d{1,2}\$[./A-Za-z0-9]{53}$/,
      ); // bcrypt hash pattern
    });

    it('should fail when Pilot role does not exist', async () => {
      // Arrange - Delete Pilot role to simulate missing role
      await prismaService.role.deleteMany({
        where: { name: 'Pilot' },
      });

      // Act & Assert
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('4'))
        .expect(500);

      // Restore Pilot role for other tests
      await prismaService.role.create({
        data: { name: 'Pilot' },
      });
    });

    it('should fail when user with same email already exists', async () => {
      // Arrange - Create first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('5'))
        .expect(201);

      // Act & Assert - Try to create second user with same email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('5'))
        .expect(409);
    });

    it('should fail when user with same username already exists', async () => {
      // Arrange - Create first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(getRegisterData('6'))
        .expect(201);

      // Act & Assert - Try to create second user with same username but different email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...getRegisterData('6'),
          email: 'different@example.com',
        })
        .expect(409);
    });
  });
});
