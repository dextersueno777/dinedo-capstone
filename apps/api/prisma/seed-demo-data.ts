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
  ['platters', 'Pork Sisig Platters', 'pork-sisig-platters', 'Pork sisig platter. Dine-in price range: ₱290–₱300.', '290.00', true, 1, '/menu/pork-sisig-platters.jpg'],
  ['pancit', 'Lomi', 'lomi', 'Regular dine-in: ₱160–₱180. Overload dine-in: ₱180–₱200.', '160.00', true, 2, '/menu/lomi.jpg'],
  ['inasal', 'Grilled Liempo', 'grilled-liempo', 'No rice: ₱160. Solo dine-in: ₱190–₱200. Unli rice: ₱220.', '160.00', true, 3, '/menu/grilled-liempo.jpg'],
  ['pancit', 'Batil Patong', 'batil-patong', 'Regular dine-in: ₱160–₱180. Overload: ₱200.', '160.00', true, 4, '/menu/batil-patong.jpg'],
  ['rice-toppings', 'Dindo’s Rice', 'dindos-rice', 'Dindo’s special rice meal. Dine-in price range: ₱210–₱220.', '210.00', true, 5, '/menu/dindos-rice.jpg'],
  ['inasal', 'Paa', 'paa', 'Solo dine-in: ₱180–₱190. Unli rice: ₱210.', '180.00', true, 6, '/menu/paa.jpg'],
  ['rice-toppings', 'Pinuneg Rice', 'pinuneg-rice', 'Pinuneg rice dine-in: ₱210–₱220. Pinuneg platters: ₱220–₱230.', '210.00', true, 7, '/menu/pinuneg-rice.jpg'],
  ['special-sinigang', 'Sinigang na Hipon', 'sinigang-na-hipon', 'Shrimp sinigang. Dine-in price range: ₱350–₱370.', '350.00', true, 8, '/menu/sinigang-na-hipon.jpg'],
  ['special-sinigang', 'Sinigang na Bangus', 'sinigang-na-bangus', 'Bangus sinigang. Dine-in price range: ₱300–₱320.', '300.00', false, 9, '/menu/sinigang-na-bangus.jpg'],
  ['special-sinigang', 'Salmon Belly Sinigang', 'salmon-belly-sinigang', 'Salmon belly sinigang. Dine-in price range: ₱350–₱370.', '350.00', true, 10, '/menu/salmon-belly-sinigang.jpg'],
  ['special-sinigang', 'Sinigang na Tilapia', 'sinigang-na-tilapia', 'Tilapia sinigang. Dine-in price range: ₱300–₱320.', '300.00', false, 11, '/menu/sinigang-na-tilapia.jpg'],
  ['special-sinigang', 'Pork Sinigang', 'pork-sinigang', 'Pork sinigang. Dine-in price range: ₱300–₱320.', '300.00', true, 12, '/menu/pork-sinigang.jpg'],
  ['rice-toppings', 'Steamed Chicken Rice', 'steamed-chicken', 'Steamed chicken rice: ₱250–₱260. Whole steamed chicken: ₱390.', '250.00', true, 13, '/menu/steamed-chicken.jpg'],
  ['pancit', 'Pancit Bila-o', 'pancit-bila-o', 'Small: ₱600. Medium: ₱800. Large: ₱1000.', '600.00', true, 14, '/menu/pancit-bila-o.jpg'],
  ['pancit', 'Mix Pancit', 'mix-pancit', 'Mixed pancit. Dine-in price range: ₱250–₱280.', '250.00', true, 15, '/menu/mix-pancit.jpg'],
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
