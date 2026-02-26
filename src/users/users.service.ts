import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private userSelect = {
    id_user: true,
    name_user: true,
    email_user: true,
    created_at: true,
    updated_at: true,
    role: { select: { id_role: true, name_role: true } },
  } as const;

  async create(dto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          name_user: dto.name,
          email_user: dto.email,
          role: { connect: { name_role: dto.role } },
        },
        select: this.userSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Email ya existe');
      if (e?.code === 'P2025') throw new BadRequestException('Rol inválido');
      throw e;
    }
  }

  async findAll(filters?: {
    name?: string;
    email?: string;
    role?: 'ADMINISTRADOR' | 'MIEMBRO';
  }) {
    const name = filters?.name?.trim();
    const email = filters?.email?.trim();
    const role = filters?.role;
    // 1) Traemos usuarios filtrados
    const users = await this.prisma.user.findMany({
      where: {
        ...(name ? { name_user: { contains: name, mode: 'insensitive' } } : {}),
        ...(email
          ? { email_user: { contains: email, mode: 'insensitive' } }
          : {}),
        ...(role ? { role: { name_role: role } } : {}),
      },
      select: {
        id_user: true,
        name_user: true,
        email_user: true,
        role: { select: { name_role: true } },
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // si no hay usuarios, devolvemos rápido
    if (users.length === 0) {
      return [];
    }

    const userIds = users.map((u) => u.id_user);

    // 2) Traemos SOLO tareas TERMINADAS de esos usuarios (vía tabla puente)
    // y calculamos: count y sum(cost_task) por usuario
    const completedTasks = await this.prisma.task.findMany({
      where: {
        status: { name_status: 'TERMINADA' },
        assignments: { some: { id_user: { in: userIds } } },
      },
      select: {
        id_task: true,
        cost_task: true,
        assignments: { select: { id_user: true } },
      },
    });

    // Acumuladores: { userId -> {count, sum} }
    const stats = new Map<number, { count: number; sum: number }>();
    for (const uid of userIds) stats.set(uid, { count: 0, sum: 0 });

    for (const task of completedTasks) {
      const cost = Number(task.cost_task); // Decimal -> number
      for (const a of task.assignments) {
        if (!stats.has(a.id_user)) continue;
        const s = stats.get(a.id_user)!;
        s.count += 1;
        s.sum += cost;
      }
    }

    // 3) Respuesta
    return users.map((u) => {
      const s = stats.get(u.id_user) ?? { count: 0, sum: 0 };
      return {
        id: u.id_user,
        name: u.name_user,
        email: u.email_user,
        role: u.role.name_role,
        completedTasksCount: s.count,
        completedTasksCostSum: Number(s.sum.toFixed(2)),
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      };
    });
  }

  async findOne(id_user: number) {
    const user = await this.prisma.user.findUnique({
      where: { id_user },
      select: this.userSelect,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id_user: number, dto: UpdateUserDto) {
    await this.findOne(id_user);

    const data: any = {};
    if (dto.name !== undefined) data.name_user = dto.name;
    if (dto.email !== undefined) data.email_user = dto.email;
    if (dto.role !== undefined)
      data.role = { connect: { name_role: dto.role } };

    try {
      return await this.prisma.user.update({
        where: { id_user },
        data,
        select: this.userSelect,
      });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new BadRequestException('Email ya existe');
      if (e?.code === 'P2025') throw new BadRequestException('Rol inválido');
      throw e;
    }
  }

  async remove(id_user: number) {
    await this.findOne(id_user);
    await this.prisma.user.delete({ where: { id_user } });
    return { ok: true };
  }
}
