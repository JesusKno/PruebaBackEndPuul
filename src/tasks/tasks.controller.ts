import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AssignAssigneesDto } from './dto/assign-assignees.dto';
import { title } from 'process';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: 'ACTIVA' | 'TERMINADA',
    @Query('assigneeId') assigneeId?: string,
    @Query('title') title?: string,
    @Query('dueDateFrom') dueDateFrom?: string,
    @Query('dueDateTo') dueDateTo?: string,
    @Query('assigneeQuery') assigneeQuery?: string,
  ) {
    const parsedAssigneeId = assigneeId ? Number(assigneeId) : undefined;
    return this.tasksService.findAll({
      status,
      assigneeId: parsedAssigneeId,
      title,
      dueDateFrom,
      dueDateTo,
      assigneeQuery,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tasksService.remove(id);
  }

  // POST /tasks/:id/assignees
  @Post(':id/assignees')
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignAssigneesDto,
  ) {
    return this.tasksService.assignUsers(id, dto.assigneeIds);
  }
}
