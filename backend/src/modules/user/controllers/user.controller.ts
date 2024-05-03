import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { User } from '@prisma/client';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(@Body() user: User) {
    return this.userService.createUser(user);
  }
}
