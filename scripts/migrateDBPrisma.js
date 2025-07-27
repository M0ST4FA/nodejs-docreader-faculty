// This script migrates data from v1 database to v2 database.
// NOTE: This assumes you have both schemas compiled (npx prisma generate) and `.env` has:
// - OLD_DATABASE_URL
// - DATABASE_URL (for the new database)
// - COMPILED_SCHEMA_PATH
// - OLD_COMPILED_SCHEMA_PATH

import { PrismaClient as OldPrismaClient } from process.env.COMPILED_SCHEMA_PATH;
import { PrismaClient as NewPrismaClient } from process.env.OLD_COMPILED_SCHEMA_PATH;

const oldDb = new OldPrismaClient();
const newDb = new NewPrismaClient();

async function migrate() {
  console.log('Starting data migration...');

  // Migrate faculties, studying years, modules, subjects, lectures, links, quizzes, questions
  const faculties = await oldDb.faculty.findMany({
    include: {
      years: {
        include: {
          modules: {
            include: {
              subjects: {
                include: {
                  lectures: {
                    include: {
                      links: true,
                      quizzes: {
                        include: {
                          questions: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const faculty of faculties) {
    const newFaculty = await newDb.faculty.create({
      data: {
        name: faculty.name,
        city: faculty.city,
        createdAt: faculty.createdAt || new Date(),
        updatedAt: faculty.updatedAt || new Date(),
        years: {
          create: faculty.years.map(year => ({
            title: year.title,
            createdAt: year.createdAt || new Date(),
            updatedAt: year.updatedAt || new Date(),
            modules: {
              create: year.modules.map(module => ({
                name: module.name,
                semesterName: module.semesterName,
                icon: module.icon,
                createdAt: module.createdAt || new Date(),
                updatedAt: module.updatedAt || new Date(),
                subjects: {
                  create: module.subjects.map(subject => ({
                    name: subject.name,
                    icon: subject.icon,
                    createdAt: subject.createdAt || new Date(),
                    updatedAt: subject.updatedAt || new Date(),
                    lectures: {
                      create: subject.lectures.map(lecture => ({
                        title: lecture.title,
                        subTitle: lecture.subTitle || null,
                        type: lecture.type,
                        date: lecture.date || null,
                        createdAt: lecture.createdAt || new Date(),
                        updatedAt: lecture.updatedAt || new Date(),
                        links: {
                          create: lecture.links.map(link => ({
                            title: link.title,
                            subTitle: link.subTitle || null,
                            url: link.url,
                            type: link.type,
                            category: link.category,
                            notifiable: link.notifiable,
                            createdAt: link.createdAt || new Date(),
                            updatedAt: link.updatedAt || new Date(),
                          })),
                        },
                        quizzes: {
                          create: lecture.quizzes.map(quiz => ({
                            title: quiz.title,
                            notifiable: quiz.notifiable,
                            createdAt: quiz.createdAt || new Date(),
                            updatedAt: quiz.updatedAt || new Date(),
                            questions: {
                              create: quiz.questions.map(q => ({
                                text: q.text,
                                image: q.image,
                                explanation: q.explanation,
                                options: q.options,
                                correctOptionIndex: q.correctOptionIndex,
                                createdAt: q.createdAt || new Date(),
                                updatedAt: q.updatedAt || new Date(),
                              })),
                            },
                          })),
                        },
                      })),
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
    });
  }

  console.log('✅ Faculty tree migration complete.');

  await oldDb.$disconnect();
  await newDb.$disconnect();

  console.log('🎉 Migration completed successfully.');
}

migrate().catch(e => {
  console.error('❌ Migration failed:', e);
  process.exit(1);
});
