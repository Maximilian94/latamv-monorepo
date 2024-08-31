import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { createErrorResponse } from '../utils/error-response.util';

@Catch(Prisma.PrismaClientInitializationError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientInitializationError,
    host: ArgumentsHost,
  ): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = HttpStatus.SERVICE_UNAVAILABLE;
    const message =
      'Estamos com dificuldades para acessar o servidor. Por favor, tente novamente em alguns minutos.';

    response.status(status).json(createErrorResponse(message));
  }
}
