import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseBoolPipe implements PipeTransform {
  transform(value: string): boolean {
    if (value.toLowerCase() === 'true') {
      return true;
    } else if (value.toLowerCase() === 'false') {
      return false;
    } else {
      throw new BadRequestException(
        `Validation failed: "${value}" is not a valid boolean string.`,
      );
    }
  }
}
