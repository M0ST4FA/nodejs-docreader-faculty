// scripts/generateTopics.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const faculties = await prisma.faculty.findMany({
    include: { years: true },
  });

  for (const faculty of faculties) {
    for (const year of faculty.years) {
      const topicName = `faculty_${faculty.id}_year_${year.id}`;
      const description = `Topic for notifications of faculty ${faculty.name} and year with Id ${year.title}`;

      // Check if topic already exists
      const exists = await prisma.topic.findUnique({
        where: { name: topicName },
      });

      if (!exists) {
        await prisma.topic.create({
          data: {
            name: topicName,
            description,
            public: true, // optional, depends on your design
            creatorId: null, // or system user id if you track this
          },
        });
        console.log(`✅ Created topic: ${topicName}`);
      } else {
        console.log(`ℹ️ Skipped (already exists): ${topicName}`);
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
