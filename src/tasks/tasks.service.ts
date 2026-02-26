import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

interface TaskFilters {
  status?: 'ACTIVA' | 'TERMINADA';
  assigneeId?: number;
  title?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  assigneeQuery?: string;
}

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
    const assigneeIds = dto.assigneeIds ?? [];

    if (assigneeIds.length > 0) {
      const existing = await this.prisma.user.findMany({
        where: { id_user: { in: assigneeIds } },
        select: { id_user: true },
      });
      if (existing.length !== assigneeIds.length) {
        throw new BadRequestException('Uno o más usuarios no existen');
      }
    }

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

          ...(assigneeIds.length > 0
            ? {
                assignments: {
                  create: assigneeIds.map((id_user) => ({ id_user })),
                },
              }
            : {}),
        },
        select: this.taskSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2025') throw new BadRequestException('Status inválido');
      throw e;
    }
  }

  async findAll(filters?: TaskFilters) {
    const where: any = {};

    if (filters?.status) {
      where.status = { name_status: filters.status };
    }

    if (filters?.title) {
      where.title_task = { contains: filters.title, mode: 'insensitive' };
    }

    if (filters?.dueDateFrom || filters?.dueDateTo) {
      where.due_date_task = {};
      if (filters.dueDateFrom)
        where.due_date_task.gte = new Date(filters.dueDateFrom);
      if (filters.dueDateTo)
        where.due_date_task.lte = new Date(filters.dueDateTo);
    }

    if (filters?.assigneeId) {
      where.assignments = { some: { id_user: filters.assigneeId } };
    }

    if (filters?.assigneeQuery) {
      const q = filters.assigneeQuery;

      const assigneeWhere = {
        some: {
          user: {
            OR: [
              { name_user: { contains: q, mode: 'insensitive' } },
              { email_user: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
      };

      // si ya hay assignments por assigneeId, combinamos
      if (where.assignments) {
        where.AND = where.AND ?? [];
        where.AND.push({ assignments: where.assignments });
        where.AND.push({ assignments: assigneeWhere });
        delete where.assignments;
      } else {
        where.assignments = assigneeWhere;
      }
    }

    return this.prisma.task.findMany({
      where,
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
    if (dto.estimatedHours !== undefined)
      data.estimated_hours_task = dto.estimatedHours;
    if (dto.spentHours !== undefined) data.spent_hours_task = dto.spentHours;
    if (dto.dueDate !== undefined) data.due_date_task = new Date(dto.dueDate);
    if (dto.cost !== undefined) data.cost_task = dto.cost;
    if (dto.status !== undefined)
      data.status = { connect: { name_status: dto.status } };

    const assigneeIds = dto.assigneeIds;

    if (assigneeIds !== undefined) {
      const uniqueIds = [...new Set(assigneeIds)];

      const existing = await this.prisma.user.findMany({
        where: { id_user: { in: uniqueIds } },
        select: { id_user: true },
      });
      if (existing.length !== uniqueIds.length) {
        throw new BadRequestException('Uno o más usuarios no existen');
      }

      try {
        await this.prisma.$transaction([
          this.prisma.task.update({ where: { id_task }, data }),
          this.prisma.taskAssignee.deleteMany({ where: { id_task } }),
          ...(uniqueIds.length > 0
            ? [
                this.prisma.taskAssignee.createMany({
                  data: uniqueIds.map((id_user) => ({ id_task, id_user })),
                  skipDuplicates: true,
                }),
              ]
            : []),
        ]);

        return this.findOne(id_task);
      } catch (e: any) {
        if (e?.code === 'P2025')
          throw new BadRequestException('Status inválido');
        throw e;
      }
    }

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
