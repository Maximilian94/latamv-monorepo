import { Body, Controller, Get, Query, Put, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { GetUser } from '../../../common/decorator/getUser.decorator';

type GetUserBy = {
  id?: string;
  usernameOrEmail?: string;
};

type UpdatePlanDto = {
  plan: 'FREE' | 'GOLD';
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

  @Put('plan')
  @UseGuards(AuthGuard)
  async updatePlan(@Body() updatePlanDto: UpdatePlanDto, @GetUser() user: any) {
    return this.userService.updateUserPlan(user.id, updatePlanDto.plan);
  }
}
