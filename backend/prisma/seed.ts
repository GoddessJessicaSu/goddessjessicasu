import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const defaultTiers = [
    { priceUsd: 20, tokenAmount: 2000, sortOrder: 0 },
    { priceUsd: 30, tokenAmount: 3000, sortOrder: 1 },
    { priceUsd: 50, tokenAmount: 6000, sortOrder: 2 },
    { priceUsd: 100, tokenAmount: 12000, sortOrder: 3 },
  ];

  for (const tier of defaultTiers) {
    const existing = await prisma.tokenTier.findFirst({
      where: { priceUsd: tier.priceUsd, tokenAmount: tier.tokenAmount },
    });
    if (!existing) {
      await prisma.tokenTier.create({ data: tier });
    }
  }

  console.log('Seed complete: default token tiers created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
