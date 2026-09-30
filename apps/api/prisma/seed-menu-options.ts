import {
  MenuOptionGroupType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const T = MenuOptionGroupType;

type Opt = { name: string; priceDelta: string; sortOrder: number };
type Grp = {
  name: string;
  type: MenuOptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: Opt[];
};

const opt = (name: string, priceDelta = '0.00', sortOrder = 1): Opt => ({
  name,
  priceDelta,
  sortOrder,
});

const group = (
  name: string,
  type: MenuOptionGroupType,
  isRequired: boolean,
  maxSelect: number,
  sortOrder: number,
  options: Opt[],
): Grp => ({
  name,
  type,
  isRequired,
  minSelect: isRequired ? 1 : 0,
  maxSelect,
  sortOrder,
  options,
});

const riceAddOns = [
  group('Rice Add-on', T.MULTIPLE, false, 2, 1, [
    opt('Extra rice', '20.00', 1),
    opt('Add egg', '20.00', 2),
  ]),
];

const sinigangOptions = [
  group('Soup Request', T.SINGLE, false, 1, 1, [
    opt('Regular soup', '0.00', 1),
    opt('Extra sour', '0.00', 2),
    opt('Extra soup', '20.00', 3),
  ]),
  group('Rice Add-on', T.MULTIPLE, false, 1, 2, [
    opt('Extra rice', '20.00', 1),
  ]),
];

const bySlug: Record<string, Grp[]> = {
  'grilled-liempo': [
    group('Serving Option', T.SINGLE, true, 1, 1, [
      opt('No rice', '0.00', 1),
      opt('Solo with rice', '30.00', 2),
      opt('Unli rice', '60.00', 3),
    ]),
    group('Sauce / Spice', T.SINGLE, false, 1, 2, [
      opt('Regular sauce', '0.00', 1),
      opt('Spicy sauce', '0.00', 2),
    ]),
  ],
  paa: [
    group('Serving Option', T.SINGLE, true, 1, 1, [
      opt('Solo with rice', '0.00', 1),
      opt('Unli rice', '30.00', 2),
    ]),
    group('Sauce / Spice', T.SINGLE, false, 1, 2, [
      opt('Regular sauce', '0.00', 1),
      opt('Spicy sauce', '0.00', 2),
    ]),
  ],
  lomi: [
    group('Serving Type', T.SINGLE, true, 1, 1, [
      opt('Regular', '0.00', 1),
      opt('Overload', '40.00', 2),
    ]),
    group('Spice Level', T.SINGLE, false, 1, 2, [
      opt('Not spicy', '0.00', 1),
      opt('Mild spicy', '0.00', 2),
      opt('Spicy', '0.00', 3),
    ]),
  ],
};


bySlug['batil-patong'] = [
  group('Serving Type', T.SINGLE, true, 1, 1, [
    opt('Regular', '0.00', 1),
    opt('Overload', '40.00', 2),
  ]),
];

bySlug['pancit-bila-o'] = [
  group('Bilao Size', T.SINGLE, true, 1, 1, [
    opt('Small', '0.00', 1),
    opt('Medium', '200.00', 2),
    opt('Large', '400.00', 3),
  ]),
];

bySlug['mix-pancit'] = [
  group('Serving Add-on', T.MULTIPLE, false, 2, 1, [
    opt('Extra vegetables', '20.00', 1),
    opt('Extra toppings', '30.00', 2),
  ]),
];

bySlug.shanghai = [
  group('Dip Option', T.SINGLE, false, 1, 1, [
    opt('Regular dip', '0.00', 1),
    opt('Extra dip', '10.00', 2),
  ]),
];

bySlug['pork-sisig-platters'] = [
  group('Sisig Add-on', T.MULTIPLE, false, 3, 1, [
    opt('Add egg', '20.00', 1),
    opt('Extra rice', '20.00', 2),
    opt('Spicy', '0.00', 3),
  ]),
];

const riceMealSlugs = [
  'dindos-rice',
  'pinuneg-rice',
  'steamed-chicken',
  'fried-tilapia',
];

const sinigangSlugs = [
  'sinigang-na-hipon',
  'sinigang-na-bangus',
  'salmon-belly-sinigang',
  'sinigang-na-tilapia',
  'pork-sinigang',
];

function getGroupsForSlug(slug: string) {
  if (bySlug[slug]) return bySlug[slug];
  if (riceMealSlugs.includes(slug)) return riceAddOns;
  if (sinigangSlugs.includes(slug)) return sinigangOptions;
  return [];
}

async function replaceGroups(menuItemId: string, groups: Grp[]) {
  await prisma.menuOptionGroup.updateMany({
    where: { menuItemId, deletedAt: null },
    data: { deletedAt: new Date() },
  });

  for (const g of groups) {
    await prisma.menuOptionGroup.create({
      data: {
        menuItemId,
        name: g.name,
        type: g.type,
        isRequired: g.isRequired,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        sortOrder: g.sortOrder,
        options: {
          create: g.options.map((o) => ({
            name: o.name,
            priceDelta: new Prisma.Decimal(o.priceDelta),
            sortOrder: o.sortOrder,
          })),
        },
      },
    });
  }
}

async function main() {
  const branch = await prisma.branch.findUnique({
    where: { code: 'TINOC' },
    select: { id: true },
  });

  if (!branch) throw new Error('TINOC branch not found.');

  const items = await prisma.menuItem.findMany({
    where: { branchId: branch.id, deletedAt: null },
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: 'asc' },
  });

  let groupCount = 0;
  let optionCount = 0;

  for (const item of items) {
    const groups = getGroupsForSlug(item.slug);
    await replaceGroups(item.id, groups);

    groupCount += groups.length;
    optionCount += groups.reduce((sum, g) => sum + g.options.length, 0);

    console.log(`${item.name}: ${groups.length} group(s)`);
  }

  console.log('Menu modifier seeding complete.');
  console.log(`Groups created: ${groupCount}`);
  console.log(`Options created: ${optionCount}`);
}

main()
  .catch((error) => {
    console.error('Menu modifier seed failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
