// prisma/seed.ts
import { Client } from 'pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no está definida en el .env');
  }

  const client = new Client({ connectionString });
  await client.connect();

  // IMPORTANTE:
  // Prisma por defecto crea tablas con nombres con mayúsculas y comillas, ej. "UserRole"
  // y columnas exactamente como en schema.prisma, ej. "name_role"
  await client.query(`
    INSERT INTO "UserRole" ("name_role") VALUES ('ADMINISTRADOR')
    ON CONFLICT ("name_role") DO NOTHING;
  `);

  await client.query(`
    INSERT INTO "UserRole" ("name_role") VALUES ('MIEMBRO')
    ON CONFLICT ("name_role") DO NOTHING;
  `);

  await client.query(`
    INSERT INTO "TaskStatus" ("name_status") VALUES ('ACTIVA')
    ON CONFLICT ("name_status") DO NOTHING;
  `);

  await client.query(`
    INSERT INTO "TaskStatus" ("name_status") VALUES ('TERMINADA')
    ON CONFLICT ("name_status") DO NOTHING;
  `);

  await client.end();
  console.log('seed ejecutado: roles y estatus insertados (si no existían).');
}

main().catch((err) => {
  console.error('Seed falló:', err);
  process.exit(1);
});
