import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSubsidiaries() {
  const subsidiaries = [
    {
      name: 'LATAM Brasil',
      code: 'LATAM_BR',
      icaoCode: 'TAM',
      description: 'LATAM Airlines Brasil',
      country: 'BR',
    },
    {
      name: 'LATAM Chile',
      code: 'LATAM_CL',
      icaoCode: 'LAN',
      description: 'LATAM Airlines Chile',
      country: 'CL',
    },
    {
      name: 'LATAM Peru',
      code: 'LATAM_PE',
      icaoCode: 'LPE',
      description: 'LATAM Airlines Peru',
      country: 'PE',
    },
    {
      name: 'LATAM Colômbia',
      code: 'LATAM_CO',
      icaoCode: 'LAI',
      description: 'LATAM Airlines Colombia',
      country: 'CO',
    },
    {
      name: 'LATAM Equador',
      code: 'LATAM_EC',
      icaoCode: 'LNE',
      description: 'LATAM Airlines Ecuador',
      country: 'EC',
    },
    {
      name: 'LATAM Paraguai',
      code: 'LATAM_PY',
      icaoCode: 'LAP',
      description: 'LATAM Airlines Paraguay',
      country: 'PY',
    },
  ];

  for (const subsidiaryData of subsidiaries) {
    try {
      await prisma.subsidiary.upsert({
        where: { code: subsidiaryData.code },
        update: {},
        create: subsidiaryData,
      });
    } catch (error) {
      // If upsert fails due to ID conflict, try to find and update
      const existing = await prisma.subsidiary.findUnique({
        where: { code: subsidiaryData.code },
      });
      
      if (!existing) {
        // If not found by code, try to create without specifying ID
        await prisma.subsidiary.create({
          data: subsidiaryData,
        });
      }
    }
  }

  console.log('Subsidiaries seeded successfully');
} 