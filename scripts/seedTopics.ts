// scripts/generateTopics.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const years = prisma.studyingYear.findMany({
    where: {},
    include: { faculty: true },
  });

  console.log('⚙️ Fetching years...');

  const promises = (await years).map(async year => {
    const topicName = year.id.toString();
    const topicDescription = `Topic for notifications of year ${year.title} of faculty ${year.faculty.name}.`;

    const topic = await prisma.topic.upsert({
      create: { name: topicName, description: topicDescription },
      update: {},
      where: { name: topicName },
    });

    await prisma.studyingYear.update({
      where: { id: year.id },
      data: { topicId: topic.id },
    });

    return topic;
  });

  console.log('✅ Fetched years successfully.');

  console.log('⚙️ Inserting topics...');

  await Promise.all(promises).then(topics =>
    topics.forEach(topic =>
      console.log(
        `✅ Successfully inserted topic with name ${topic.name} or it already existed.`,
      ),
    ),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
