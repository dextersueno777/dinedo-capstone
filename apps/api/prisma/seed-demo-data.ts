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
  ['platters', 'Shanghai', 'shanghai', 'Crispy fried Shanghai rolls.', '1.00', true, 1, '/menu/shanghai.jpg'],
  ['pancit', 'Batil Patong', 'batil-patong', 'Hearty noodle dish with toppings.', '1.00', true, 2, '/menu/batil-patong.jpg'],
  ['inasal', 'Grilled Liempo', 'grilled-liempo', 'Grilled pork belly meal.', '1.00', true, 3, '/menu/grilled-liempo.jpg'],
  ['pancit', 'Lomi', 'lomi', 'Thick noodle soup served hot.', '1.00', false, 4, '/menu/lomi.jpg'],
  ['platters', 'Pork Sisig Platters', 'pork-sisig-platters', 'Sizzling pork sisig platter.', '1.00', true, 5, '/menu/pork-sisig-platters.jpg'],
  ['pancit', 'Mix Pancit', 'mix-pancit', 'Mixed pancit for sharing.', '1.00', true, 6, '/menu/mix-pancit.jpg'],
  ['pancit', 'Pancit Bila-o', 'pancit-bila-o', 'Pancit served in bila-o platter.', '1.00', true, 7, '/menu/pancit-bila-o.jpg'],
  ['rice-toppings', 'Steamed Chicken', 'steamed-chicken', 'Steamed chicken rice meal.', '1.00', false, 8, '/menu/steamed-chicken.jpg'],
  ['special-sinigang', 'Pork Sinigang', 'pork-sinigang', 'Pork sour soup with vegetables.', '1.00', true, 9, '/menu/pork-sinigang.jpg'],
  ['special-sinigang', 'Sinigang na Tilapia', 'sinigang-na-tilapia', 'Tilapia sour soup with vegetables.', '1.00', false, 10, '/menu/sinigang-na-tilapia.jpg'],
  ['special-sinigang', 'Salmon Belly Sinigang', 'salmon-belly-sinigang', 'Salmon belly sour soup.', '1.00', false, 11, '/menu/salmon-belly-sinigang.jpg'],
  ['special-sinigang', 'Sinigang na Bangus', 'sinigang-na-bangus', 'Bangus sour soup with vegetables.', '1.00', false, 12, '/menu/sinigang-na-bangus.jpg'],
  ['special-sinigang', 'Sinigang na Hipon', 'sinigang-na-hipon', 'Shrimp sour soup with vegetables.', '1.00', false, 13, '/menu/sinigang-na-hipon.jpg'],
  ['rice-toppings', 'Fried Tilapia', 'fried-tilapia', 'Fried tilapia rice meal.', '1.00', false, 14, '/menu/fried-tilapia.jpg'],
  ['rice-toppings', 'Pinuneg Rice', 'pinuneg-rice', 'Pinuneg served with rice.', '1.00', true, 15, '/menu/pinuneg-rice.jpg'],
  ['inasal', 'Paa', 'paa', 'Chicken leg inasal meal.', '1.00', false, 16, '/menu/paa.jpg'],
  ['rice-toppings', 'Dindo’s Rice', 'dindos-rice', 'Dindo’s special rice meal.', '1.00', true, 17, '/menu/dindos-rice.jpg'],
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

  const activeMenuSlugs = demoMenuItems.map((item) => item[2]);

  await prisma.menuItem.updateMany({
    where: {
      branchId: branch.id,
      slug: { notIn: [...activeMenuSlugs] },
    },
    data: {
      status: MenuItemStatus.HIDDEN,
      deletedAt: new Date(),
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
    imageUrl,
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

    const menuItem = await prisma.menuItem.upsert({
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

    await prisma.menuItemImage.deleteMany({
      where: { menuItemId: menuItem.id },
    });

    await prisma.menuItemImage.create({
      data: {
        menuItemId: menuItem.id,
        url: imageUrl,
        altText: name,
        sortOrder: 1,
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
