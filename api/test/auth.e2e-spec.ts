import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prismaService = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prismaService.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up database after all tests
    await prismaService.user.deleteMany();
    await prismaService.$disconnect();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    const validRegisterDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.username).toBe('testuser');
          expect(res.body.user.displayName).toBe('Test User');
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, email: 'invalid-email' })
        .expect(400);
    });

    it('should fail with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, password: '123' })
        .expect(400);
    });

    it('should fail with duplicate email', async () => {
      // Register first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterDto)
        .expect(201);

      // Try to register with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterDto, username: 'different' })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    const userCredentials = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      displayName: 'Test User',
    };

    beforeEach(async () => {
      // Register a user before each login test
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userCredentials);
    });

    it('should login with email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should login with username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'testuser',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.username).toBe('testuser');
        });
    });

    it('should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail with non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and get token
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          displayName: 'Test User',
        });

      authToken = response.body.token;
    });

    it('should get user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.username).toBe('testuser');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
