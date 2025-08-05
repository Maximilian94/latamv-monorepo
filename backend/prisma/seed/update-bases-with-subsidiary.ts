import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateBasesWithSubsidiary() {
  try {
    // Get LATAM Brasil subsidiary
    const latamBrasil = await prisma.subsidiary.findUnique({
      where: { code: 'LATAM_BR' },
    });

    if (!latamBrasil) {
      console.log('LATAM Brasil subsidiary not found. Please run subsidiary seed first.');
      return;
    }

    // Update all existing bases to LATAM Brasil subsidiary
    const updatedBases = await prisma.base.updateMany({
      where: {
        subsidiaryId: null,
      },
      data: {
        subsidiaryId: latamBrasil.id,
      },
    });

    console.log(`Updated ${updatedBases.count} bases to LATAM Brasil subsidiary`);
  } catch (error) {
    console.error('Error updating bases with subsidiary:', error);
  }
} 