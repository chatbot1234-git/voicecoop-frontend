import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
// Types utilitaires
export type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    conversations: true;
    votes: true;
    proposals: true;
  };
}>;
export type ConversationWithMessages = Prisma.ConversationGetPayload<{
  include: {
    messages: true;
    user: true;
  };
}>;
export type ProposalWithVotes = Prisma.ProposalGetPayload<{
  include: {
    votes: true;
    author: true;
  };
}>;
// Import des types Prisma
import { Prisma } from '@prisma/client';
export { Prisma };