import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

globalForPrisma.prisma = prisma;

// Graceful shutdown on process termination
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  const handleShutdown = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  };

  process.once('beforeExit', handleShutdown);
}
