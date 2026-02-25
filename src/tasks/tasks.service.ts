import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  private taskSelect = {
    id_task: true,
    title_task: true,
    description_task: true,
    estimated_hours_task: true,
    spent_hours_task: true,
    due_date_task: true,
    cost_task: true,
    created_at: true,
    updated_at: true,
    status: { select: { id_status: true, name_status: true } },
    assignments: {
      select: {
        assigned_at: true,
        user: { select: { id_user: true, name_user: true, email_user: true } },
      },
    },
  } as const;

  async create(dto: CreateTaskDto) {
    try {
      return await this.prisma.task.create({
        data: {
          title_task: dto.title,
          description_task: dto.description,
          estimated_hours_task: dto.estimatedHours,
          spent_hours_task: dto.spentHours,
          due_date_task: new Date(dto.dueDate),
          cost_task: dto.cost,
          status: { connect: { name_status: dto.status } },
        },
        select: this.taskSelect,
      });
    } catch (e: any) {
      // si falla el connect al catálogo TaskStatus
      if (e?.code === 'P2025') throw new BadRequestException('Status inválido');
      throw e;
    }
  }

  async findAll(filters?: { status?: 'ACTIVA' | 'TERMINADA'; assigneeId?: number }) {
    return this.prisma.task.findMany({
      where: {
        ...(filters?.status ? { status: { name_status: filters.status } } : {}),
        ...(filters?.assigneeId
          ? { assignments: { some: { id_user: filters.assigneeId } } }
          : {}),
      },
      select: this.taskSelect,
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id_task: number) {
    const task = await this.prisma.task.findUnique({
      where: { id_task },
      select: this.taskSelect,
    });
    if (!task) throw new NotFoundException('Tarea no encontrada');
    return task;
  }

  async update(id_task: number, dto: UpdateTaskDto) {
    await this.findOne(id_task);

    const data: any = {};
    if (dto.title !== undefined) data.title_task = dto.title;
    if (dto.description !== undefined) data.description_task = dto.description;
    if (dto.estimatedHours !== undefined) data.estimated_hours_task = dto.estimatedHours;
    if (dto.spentHours !== undefined) data.spent_hours_task = dto.spentHours;
    if (dto.dueDate !== undefined) data.due_date_task = new Date(dto.dueDate);
    if (dto.cost !== undefined) data.cost_task = dto.cost;
    if (dto.status !== undefined) data.status = { connect: { name_status: dto.status } };

    try {
      return await this.prisma.task.update({
        where: { id_task },
        data,
        select: this.taskSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new BadRequestException('Status inválido');
      throw e;
    }
  }

  async remove(id_task: number) {
    await this.findOne(id_task);
    await this.prisma.task.delete({ where: { id_task } });
    return { ok: true };
  }

  async assignUsers(id_task: number, assigneeIds: number[]) {
    // 1) valida task existe
    await this.findOne(id_task);

    // 2) valida que existan usuarios
    const existing = await this.prisma.user.findMany({
      where: { id_user: { in: assigneeIds } },
      select: { id_user: true },
    });

    if (existing.length !== assigneeIds.length) {
      throw new BadRequestException('Uno o más usuarios no existen');
    }

    // 3) inserta en tabla puente (PK compuesta evita duplicados)
    await this.prisma.taskAssignee.createMany({
      data: assigneeIds.map((id_user) => ({ id_task, id_user })),
      skipDuplicates: true,
    });

    // 4) regresa la tarea ya con asignaciones
    return this.findOne(id_task);
  }
}
