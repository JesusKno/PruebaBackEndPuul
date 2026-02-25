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

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { created_at: 'desc' },
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
    if (dto.role !== undefined) data.role = { connect: { name_role: dto.role } };

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
