import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBases() {
  const bases = [
    {
      name: 'São Paulo',
      description: 'Main hub for São Paulo operations with multiple airports',
      city: 'São Paulo',
      state: 'São Paulo',
      country: 'BR',
      airports: [
        { airportCode: 'SBGR' }, // Guarulhos
        { airportCode: 'SBSP' }, // Congonhas
      ],
    },
    {
      name: 'Rio de Janeiro',
      description: 'Hub for Rio de Janeiro operations',
      city: 'Rio de Janeiro',
      state: 'Rio de Janeiro',
      country: 'BR',
      airports: [
        { airportCode: 'SBGL' }, // Galeão
        { airportCode: 'SBRJ' }, // Santos Dumont
      ],
    },
    {
      name: 'Brasília',
      description: 'Capital hub for central operations',
      city: 'Brasília',
      state: 'Distrito Federal',
      country: 'BR',
      airports: [
        { airportCode: 'SBBR' }, // Brasília
      ],
    },
    {
      name: 'Porto Alegre',
      description: 'Southern hub for regional operations',
      city: 'Porto Alegre',
      state: 'Rio Grande do Sul',
      country: 'BR',
      airports: [
        { airportCode: 'SBPA' }, // Porto Alegre
      ],
    },
  ];

  for (const baseData of bases) {
    const { airports, ...baseInfo } = baseData;
    
    const base = await prisma.base.upsert({
      where: { name: baseInfo.name },
      update: {},
      create: baseInfo,
    });

    // Add airports to the base
    for (const airport of airports) {
      await prisma.baseAirport.upsert({
        where: {
          baseId_airportCode: {
            baseId: base.id,
            airportCode: airport.airportCode,
          },
        },
        update: {},
        create: {
          baseId: base.id,
          airportCode: airport.airportCode,
        },
      });
    }
  }

  console.log('Bases and airports seeded successfully');
} 