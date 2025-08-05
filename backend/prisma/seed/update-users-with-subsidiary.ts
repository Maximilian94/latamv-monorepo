import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function updateUsersWithSubsidiary() {
  try {
    // Get LATAM Brasil subsidiary
    const latamBrasil = await prisma.subsidiary.findUnique({
      where: { code: 'LATAM_BR' },
    });

    if (!latamBrasil) {
      console.log('LATAM Brasil subsidiary not found. Please run subsidiary seed first.');
      return;
    }

    // Update all existing users to LATAM Brasil subsidiary
    const updatedUsers = await prisma.user.updateMany({
      where: {
        subsidiaryId: null,
      },
      data: {
        subsidiaryId: latamBrasil.id,
      },
    });

    console.log(`Updated ${updatedUsers.count} users to LATAM Brasil subsidiary`);
  } catch (error) {
    console.error('Error updating users with subsidiary:', error);
  }
} 