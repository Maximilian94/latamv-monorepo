import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedBases() {
  const basesData = [
    // LATAM Brasil bases
    {
      subsidiaryCode: 'LATAM_BR',
      bases: [
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
      ],
    },
    // LATAM Chile bases
    {
      subsidiaryCode: 'LATAM_CL',
      bases: [
        {
          name: 'Santiago',
          description: 'Main hub for Santiago operations',
          city: 'Santiago',
          state: 'Región Metropolitana',
          country: 'CL',
          airports: [
            { airportCode: 'SCEL' }, // Arturo Merino Benítez
          ],
        },
      ],
    },
    // LATAM Peru bases
    {
      subsidiaryCode: 'LATAM_PE',
      bases: [
        {
          name: 'Lima',
          description: 'Main hub for Lima operations',
          city: 'Lima',
          state: 'Lima',
          country: 'PE',
          airports: [
            { airportCode: 'SPJC' }, // Jorge Chávez
          ],
        },
      ],
    },
    // LATAM Colombia bases
    {
      subsidiaryCode: 'LATAM_CO',
      bases: [
        {
          name: 'Bogotá',
          description: 'Main hub for Bogotá operations',
          city: 'Bogotá',
          state: 'Cundinamarca',
          country: 'CO',
          airports: [
            { airportCode: 'SKBO' }, // El Dorado
          ],
        },
      ],
    },
    // LATAM Ecuador bases
    {
      subsidiaryCode: 'LATAM_EC',
      bases: [
        {
          name: 'Quito',
          description: 'Main hub for Quito operations',
          city: 'Quito',
          state: 'Pichincha',
          country: 'EC',
          airports: [
            { airportCode: 'SEQU' }, // Mariscal Sucre
          ],
        },
        {
          name: 'Guayaquil',
          description: 'Secondary hub for Guayaquil operations',
          city: 'Guayaquil',
          state: 'Guayas',
          country: 'EC',
          airports: [
            { airportCode: 'SEGS' }, // José Joaquín de Olmedo
          ],
        },
      ],
    },
    // LATAM Paraguay bases
    {
      subsidiaryCode: 'LATAM_PY',
      bases: [
        {
          name: 'Asunción',
          description: 'Main hub for Asunción operations',
          city: 'Asunción',
          state: 'Central',
          country: 'PY',
          airports: [
            { airportCode: 'SGAS' }, // Silvio Pettirossi
          ],
        },
      ],
    },
  ];

  for (const subsidiaryData of basesData) {
    // Find subsidiary
    const subsidiary = await prisma.subsidiary.findUnique({
      where: { code: subsidiaryData.subsidiaryCode },
    });

    if (!subsidiary) {
      console.log(`Subsidiary ${subsidiaryData.subsidiaryCode} not found. Please run subsidiary seed first.`);
      continue;
    }

    for (const baseData of subsidiaryData.bases) {
      const { airports, ...baseInfo } = baseData;

      const base = await prisma.base.upsert({
        where: { name: baseInfo.name },
        update: {
          subsidiaryId: subsidiary.id,
        },
        create: {
          ...baseInfo,
          subsidiary: {
            connect: { id: subsidiary.id },
          },
        },
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
  }

  console.log('Bases and airports seeded successfully');
} 