import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({
  path: resolve(__dirname, '../../../.env')
});

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@dinedo.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'DineDo';
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Admin';

  const tinocBranch = await prisma.branch.upsert({
    where: {
      code: 'TINOC'
    },
    update: {
      name: 'Dindo’s Restaurant - Tinoc Branch',
      address: 'Tinoc, Ifugao, Philippines',
      status: 'ACTIVE'
    },
    create: {
      name: 'Dindo’s Restaurant - Tinoc Branch',
      code: 'TINOC',
      address: 'Tinoc, Ifugao, Philippines',
      status: 'ACTIVE'
    }
  });

  await prisma.branchSettings.upsert({
    where: {
      branchId: tinocBranch.id
    },
    update: {
      timezone: 'Asia/Manila',
      orderingOpenTime: '08:00',
      orderingCloseTime: '18:00',
      normalDeliveryKm: '1.00',
      reservationsEnabled: true
    },
    create: {
      branchId: tinocBranch.id,
      timezone: 'Asia/Manila',
      orderingOpenTime: '08:00',
      orderingCloseTime: '18:00',
      normalDeliveryKm: '1.00',
      reservationsEnabled: true
    }
  });

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id
  });

  const adminUser = await prisma.user.upsert({
    where: {
      email: adminEmail.toLowerCase()
    },
    update: {
      branchId: tinocBranch.id,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      deletedAt: null
    },
    create: {
      branchId: tinocBranch.id,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    }
  });

  await prisma.userProfile.upsert({
    where: {
      userId: adminUser.id
    },
    update: {
      firstName: adminFirstName,
      lastName: adminLastName
    },
    create: {
      userId: adminUser.id,
      firstName: adminFirstName,
      lastName: adminLastName
    }
  });

  console.log('Seed completed successfully.');
  console.log(`Branch: ${tinocBranch.name} (${tinocBranch.code})`);
  console.log(`Admin: ${adminEmail.toLowerCase()}`);
}

main()
  .catch((error) => {
    console.error('Seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
