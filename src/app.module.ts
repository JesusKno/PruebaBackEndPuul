import { Module } from '@nestjs/common';

import { UsersModule } from './users/users.module';
import { PrismaModule } from 'prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [UsersModule, PrismaModule, TasksModule],
})
export class AppModule {}
