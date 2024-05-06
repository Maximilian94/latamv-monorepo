// prisma/seed.ts

import { Prisma, PrismaClient } from '@prisma/client';

// initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  const aircratfs: Prisma.AircraftModelCreateInput[] = [
    {
      code: 'A19N',
      manufacturer: 'Airbus',
      model: 'A319neo',
    },
    {
      code: 'A319',
      manufacturer: 'Airbus',
      model: 'A319',
    },
    {
      code: 'A320',
      manufacturer: 'Airbus',
      model: 'A320',
    },
    {
      code: 'A20N',
      manufacturer: 'Airbus',
      model: 'A320neo',
    },
    {
      code: 'A321',
      manufacturer: 'Airbus',
      model: 'A321',
    },
    {
      code: 'A21N',
      manufacturer: 'Airbus',
      model: 'A321neo',
    },
    {
      code: 'B789',
      manufacturer: 'Boeing',
      model: '787-9',
    },
  ];

  const roles: Prisma.RoleCreateInput[] = [
    {
      name: 'Crew',
    },
  ];

  await prisma.$transaction([
    ...aircratfs.map((cur) => {
      return prisma.aircraftModel.upsert({
        where: { code: cur.code },
        update: {},
        create: cur,
      });
    }),
    ...roles.map((role) =>
      prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: role,
      }),
    ),
  ]);
}

// execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close Prisma Client at the end
    await prisma.$disconnect();
  });
