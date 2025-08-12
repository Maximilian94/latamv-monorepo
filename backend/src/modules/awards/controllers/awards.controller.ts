import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AwardsService } from '../services/awards.service';
import { CreateAwardDto } from '../dto/create-award.dto';
import { UpdateAwardDto } from '../dto/update-award.dto';
import { Award } from '../interfaces/award.interface';
import { UserAward, AwardWithUserAward } from '../interfaces/user-award.interface';
import { AuthGuard } from '../../../common/guards/auth.guard';

@Controller('awards')
@UseGuards(AuthGuard)
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  async findAll(): Promise<Award[]> {
    return this.awardsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Award> {
    return this.awardsService.findById(id);
  }

  @Post()
  async create(@Body() createAwardDto: CreateAwardDto): Promise<Award> {
    return this.awardsService.create(createAwardDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAwardDto: UpdateAwardDto,
  ): Promise<Award> {
    return this.awardsService.update(id, updateAwardDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<Award> {
    return this.awardsService.delete(id);
  }

  @Get('user/:userId')
  async getUserAwards(@Param('userId', ParseIntPipe) userId: number): Promise<UserAward[]> {
    return this.awardsService.getUserAwards(userId);
  }

  @Get('user/:userId/all')
  async getAllAwardsWithUserStatus(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<AwardWithUserAward[]> {
    return this.awardsService.getAllAwardsWithUserStatus(userId);
  }

  @Get('user/:userId/:awardId')
  async getUserAward(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('awardId', ParseIntPipe) awardId: number,
  ): Promise<UserAward> {
    return this.awardsService.getUserAward(userId, awardId);
  }

  @Post(':id/obtain')
  async obtainAward(
    @Param('id', ParseIntPipe) awardId: number,
    @Request() req,
  ): Promise<UserAward> {
    const userId = req.user.id;
    return this.awardsService.obtainAward(userId, awardId);
  }

  @Delete('user/:userId/:awardId')
  async removeUserAward(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('awardId', ParseIntPipe) awardId: number,
  ): Promise<UserAward> {
    return this.awardsService.removeUserAward(userId, awardId);
  }
}
