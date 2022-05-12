import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

// https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/logging
prisma.$on('query', (event: any) => {
  // console.log(`Query: ${event.query}`);
  console.log(`Duration: ${event.duration}ms`);
});

// See different approach at https://vercel.com/guides/nextjs-prisma-postgres

export default prisma;
