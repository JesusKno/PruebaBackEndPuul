-- CreateTable
CREATE TABLE "UserRole" (
    "id_role" SERIAL NOT NULL,
    "name_role" VARCHAR(50) NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "TaskStatus" (
    "id_status" SERIAL NOT NULL,
    "name_status" VARCHAR(50) NOT NULL,

    CONSTRAINT "TaskStatus_pkey" PRIMARY KEY ("id_status")
);

-- CreateTable
CREATE TABLE "User" (
    "id_user" SERIAL NOT NULL,
    "name_user" VARCHAR(150) NOT NULL,
    "email_user" VARCHAR(255) NOT NULL,
    "id_role_user" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "Task" (
    "id_task" SERIAL NOT NULL,
    "title_task" VARCHAR(255) NOT NULL,
    "description_task" TEXT,
    "estimated_hours_task" DECIMAL(5,2) NOT NULL,
    "spent_hours_task" DECIMAL(5,2),
    "due_date_task" TIMESTAMP(3) NOT NULL,
    "id_status_task" INTEGER NOT NULL,
    "cost_task" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id_task")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id_task" INTEGER NOT NULL,
    "id_user" INTEGER NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id_task","id_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_name_role_key" ON "UserRole"("name_role");

-- CreateIndex
CREATE UNIQUE INDEX "TaskStatus_name_status_key" ON "TaskStatus"("name_status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_user_key" ON "User"("email_user");

-- CreateIndex
CREATE INDEX "TaskAssignee_id_user_idx" ON "TaskAssignee"("id_user");

-- CreateIndex
CREATE INDEX "TaskAssignee_id_task_idx" ON "TaskAssignee"("id_task");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_id_role_user_fkey" FOREIGN KEY ("id_role_user") REFERENCES "UserRole"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_id_status_task_fkey" FOREIGN KEY ("id_status_task") REFERENCES "TaskStatus"("id_status") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_id_task_fkey" FOREIGN KEY ("id_task") REFERENCES "Task"("id_task") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;
