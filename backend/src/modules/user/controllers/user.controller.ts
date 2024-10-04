import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';

type GetUserBy = {
  id?: string;
  usernameOrEmail?: string;
};

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async checkIfUsernameOrEmailExists(@Query() query: GetUserBy) {
    if (query.usernameOrEmail) {
      return this.userService.checkIfUsernameExists(query.usernameOrEmail);
    }

    throw new Error('Invalid request');
  }
}
