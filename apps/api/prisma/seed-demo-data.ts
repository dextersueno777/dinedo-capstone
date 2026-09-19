import {
  MenuItemStatus,
  Prisma,
  PrismaClient,
  RiderAvailabilityStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

const demoUsers = [
  ['customer.demo@dinedo.local', 'Customer123!', UserRole.CUSTOMER, 'Demo', 'Customer', '09170000001'],
  ['kitchen@dinedo.local', 'ChangeMe123!', UserRole.KITCHEN, 'Kitchen', 'Staff', '09170000002'],
  ['rider@dinedo.local', 'ChangeMe123!', UserRole.RIDER, 'Demo', 'Rider', '09170000003'],
] as const;

const demoMenuItems = [
  ['inasal', 'Chicken Inasal', 'chicken-inasal', 'Grilled chicken served with rice.', '120.00', true, 1],
  ['special-sinigang', 'Special Sinigang', 'special-sinigang', 'Hot sour soup with vegetables.', '180.00', true, 2],
  ['pancit', 'Pancit Canton', 'pancit-canton', 'Stir-fried noodles for sharing.', '150.00', true, 3],
  ['rice-toppings', 'Pork Adobo Rice Topping', 'pork-adobo-rice-topping', 'Adobo served over rice.', '110.00', true, 4],
  ['beverages', 'Iced Tea', 'iced-tea', 'Cold house iced tea.', '45.00', false, 5],
  ['breakfast', 'Tapsilog', 'tapsilog', 'Beef tapa with garlic rice and egg.', '130.00', false, 6],
  ['platters', 'Family Platter', 'family-platter', 'Shared platter for family meals.', '350.00', true, 7],
] as const;

async function upsertUser(
  branchId: string,
  email: string,
  password: string,
  role: UserRole,
  firstName: string,
  lastName: string,
  phoneNumber: string,
) {
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      branchId,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
      deletedAt: null,
    },
    create: {
      branchId,
      email,
      passwordHash,
      role,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.userProfile.upsert({
    where: { userId: user.id },
    update: { firstName, lastName, phoneNumber },
    create: { userId: user.id, firstName, lastName, phoneNumber },
  });

  return user;
}

async function main(): Promise<void> {
  const branch = await prisma.branch.findUnique({
    where: { code: 'TINOC' },
  });

  if (!branch) {
    throw new Error('TINOC branch not found. Run db:seed first.');
  }

  const createdUsers = new Map<string, Awaited<ReturnType<typeof upsertUser>>>();

  for (const [email, password, role, firstName, lastName, phoneNumber] of demoUsers) {
    const user = await upsertUser(
      branch.id,
      email,
      password,
      role,
      firstName,
      lastName,
      phoneNumber,
    );
    createdUsers.set(email, user);
  }

  const customer = createdUsers.get('customer.demo@dinedo.local');
  const rider = createdUsers.get('rider@dinedo.local');

  if (!customer || !rider) {
    throw new Error('Demo customer or rider was not created.');
  }

  const existingAddress = await prisma.address.findFirst({
    where: {
      userId: customer.id,
      label: 'Tinoc Demo Address',
      deletedAt: null,
    },
  });

  const addressData = {
    recipient: 'Demo Customer',
    phoneNumber: '09170000001',
    line1: 'Poblacion Tinoc',
    barangay: 'Poblacion',
    municipality: 'Tinoc',
    province: 'Ifugao',
    postalCode: '3609',
    landmark: 'Near Dindo’s Restaurant',
    latitude: new Prisma.Decimal('16.7000000'),
    longitude: new Prisma.Decimal('120.9000000'),
    isDefault: true,
  };

  if (existingAddress) {
    await prisma.address.update({
      where: { id: existingAddress.id },
      data: addressData,
    });
  } else {
    await prisma.address.create({
      data: {
        userId: customer.id,
        label: 'Tinoc Demo Address',
        ...addressData,
      },
    });
  }

  await prisma.riderProfile.upsert({
    where: { userId: rider.id },
    update: {
      branchId: branch.id,
      availabilityStatus: RiderAvailabilityStatus.AVAILABLE,
      vehicleType: 'Motorcycle',
      plateNumber: 'DEMO-001',
      emergencyContact: '09170000004',
      deletedAt: null,
    },
    create: {
      userId: rider.id,
      branchId: branch.id,
      availabilityStatus: RiderAvailabilityStatus.AVAILABLE,
      vehicleType: 'Motorcycle',
      plateNumber: 'DEMO-001',
      emergencyContact: '09170000004',
    },
  });

  for (const [
    categorySlug,
    name,
    slug,
    description,
    price,
    isFeatured,
    sortOrder,
  ] of demoMenuItems) {
    const category = await prisma.menuCategory.findUnique({
      where: {
        branchId_slug: {
          branchId: branch.id,
          slug: categorySlug,
        },
      },
    });

    if (!category) {
      throw new Error(`Missing menu category: ${categorySlug}`);
    }

    await prisma.menuItem.upsert({
      where: {
        branchId_slug: {
          branchId: branch.id,
          slug,
        },
      },
      update: {
        categoryId: category.id,
        name,
        description,
        price: new Prisma.Decimal(price),
        status: MenuItemStatus.AVAILABLE,
        isFeatured,
        sortOrder,
        deletedAt: null,
      },
      create: {
        branchId: branch.id,
        categoryId: category.id,
        name,
        slug,
        description,
        price: new Prisma.Decimal(price),
        status: MenuItemStatus.AVAILABLE,
        isFeatured,
        sortOrder,
      },
    });
  }

  console.log('Demo data seeded successfully.');
  console.log('Customer: customer.demo@dinedo.local / Customer123!');
  console.log('Kitchen: kitchen@dinedo.local / ChangeMe123!');
  console.log('Rider: rider@dinedo.local / ChangeMe123!');
  console.log(`Menu items seeded: ${demoMenuItems.length}`);
}

main()
  .catch((error) => {
    console.error('Demo data seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
