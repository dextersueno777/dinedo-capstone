import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const menuCategories = [
  ['INASAL', 'inasal', 1],
  ['SPECIAL SINIGANG', 'special-sinigang', 2],
  ['PANCIT', 'pancit', 3],
  ['RICE TOPPINGS', 'rice-toppings', 4],
  ['LIQUORS', 'liquors', 5],
  ['BEVERAGES', 'beverages', 6],
  ['BREAKFAST', 'breakfast', 7],
  ['PLATTERS', 'platters', 8],
] as const;

const restaurantTables = [
  ['Table 1', 4, 'Dining Area'],
  ['Table 2', 4, 'Dining Area'],
  ['Table 3', 4, 'Dining Area'],
  ['Table 4', 6, 'Dining Area'],
  ['Table 5', 6, 'Dining Area'],
] as const;

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { code: 'TINOC' },
  });

  if (!branch) {
    throw new Error('TINOC branch not found. Run the main seed first.');
  }

  for (const [name, slug, sortOrder] of menuCategories) {
    await prisma.menuCategory.upsert({
      where: {
        branchId_slug: {
          branchId: branch.id,
          slug,
        },
      },
      update: {
        name,
        sortOrder,
        isActive: true,
        deletedAt: null,
      },
      create: {
        branchId: branch.id,
        name,
        slug,
        sortOrder,
        isActive: true,
      },
    });
  }

  for (const [name, capacity, location] of restaurantTables) {
    await prisma.restaurantTable.upsert({
      where: {
        branchId_name: {
          branchId: branch.id,
          name,
        },
      },
      update: {
        capacity,
        location,
        status: 'ACTIVE',
        deletedAt: null,
      },
      create: {
        branchId: branch.id,
        name,
        capacity,
        location,
        status: 'ACTIVE',
      },
    });
  }

  console.log('Seeded menu categories and starter restaurant tables.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
