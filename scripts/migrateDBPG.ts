import { Client } from 'pg';

const v1 = new Client({
  connectionString: process.env.OLD_DATABASE_URL,
});

const v2 = new Client({
  connectionString: process.env.NEW_DATABASE_URL,
});

async function main() {
  await v1.connect();
  await v2.connect();

  await v1.query(`SET search_path TO docreaderguide;`);

  console.log(
    '🚀 Starting data extraction from old database (excluding user data)...',
  );

  const v1DatabaseResult = await v1.query(`
    SELECT
      f.id AS "oldFacultyId",
      f.name AS "facultyName",
      f.city AS "facultyCity",
      f."createdAt" AS "facultyCreatedAt",
      f."updatedAt" AS "facultyUpdatedAt",
      COALESCE(json_agg(DISTINCT jsonb_build_object(
        'oldYearId', y.id,
        'yearTitle', y.title,
        'yearCreatedAt', y."createdAt",
        'yearUpdatedAt', y."updatedAt",
        'modules', (
          SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
            'oldModuleId', m.id,
            'moduleName', m.name,
            'semesterName', m."semesterName",
            'icon', m.icon,
            'moduleCreatedAt', m."createdAt",
            'moduleUpdatedAt', m."updatedAt",
            'subjects', (
              SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
                'oldSubjectId', s.id,
                'subjectName', s.name,
                'icon', s.icon,
                'subjectCreatedAt', s."createdAt",
                'subjectUpdatedAt', s."updatedAt",
                'lectures', (
                  SELECT COALESCE(json_agg(DISTINCT jsonb_build_object(
                    'oldLectureId', l.id,
                    'lectureTitle', l.title,
                    'lectureSubTitle', l."subTitle",
                    'lectureType', l.type,
                    'lectureDate', l.date,
                    'lectureCreatedAt', l."createdAt",
                    'lectureUpdatedAt', l."updatedAt",
                    'links', (
                      SELECT COALESCE(json_agg(jsonb_build_object(
                        'oldLinkId', ll.id,
                        'linkTitle', ll.title,
                        'linkSubTitle', ll."subTitle",
                        'url', ll.url,
                        'type', ll.type,
                        'category', ll.category,
                        'notifiable', ll.notifiable,
                        'linkCreatedAt', ll."createdAt",
                        'linkUpdatedAt', ll."updatedAt"
                      )) FILTER (WHERE ll.id IS NOT NULL), '[]')
                      FROM "LectureLink" ll
                      WHERE ll."lectureId" = l.id
                    ),
                    'mcqQuizzes', (
                      SELECT COALESCE(json_agg(jsonb_build_object(
                        'oldQuizId', q.id,
                        'quizTitle', q.title,
                        'notifiable', q.notifiable,
                        'quizCreatedAt', q."createdAt",
                        'quizUpdatedAt', q."updatedAt",
                        'questions', (
                          SELECT COALESCE(json_agg(jsonb_build_object(
                            'oldQuestionId', qs.id,
                            'text', qs.text,
                            'image', qs.image,
                            'explanation', qs.explanation,
                            'options', qs.options,
                            'correctOptionIndex', qs."correctOptionIndex",
                            'questionCreatedAt', qs."createdAt",
                            'questionUpdatedAt', qs."updatedAt"
                          )) FILTER (WHERE qs.id IS NOT NULL), '[]')
                          FROM "Question" qs
                          WHERE qs."quizId" = q.id
                        )
                      )) FILTER (WHERE q.id IS NOT NULL), '[]')
                      FROM "Quiz" q
                      WHERE q."lectureId" = l.id
                    )
                  )) FILTER (WHERE l.id IS NOT NULL), '[]')
                  FROM "Lecture" l
                  WHERE l."subjectId" = s.id
                )
              )) FILTER (WHERE s.id IS NOT NULL), '[]')
              FROM "Subject" s
              WHERE s."moduleId" = m.id
            )
          )) FILTER (WHERE m.id IS NOT NULL), '[]')
          FROM "Module" m
          WHERE m."yearId" = y.id
        )
      )) FILTER (WHERE y.id IS NOT NULL), '[]') AS "years"
    FROM "Faculty" f
    LEFT JOIN "StudyingYear" y ON y."facultyId" = f.id
    GROUP BY f.id;
  `);

  const v1Data = v1DatabaseResult.rows;
  console.log(`✅ Extracted ${v1Data.length} faculties and associated data.`);

  // --- Mappings for Old IDs to New IDs ---
  const facultyIdMap = new Map<number, number>();
  const yearIdMap = new Map<number, number>();
  const moduleIdMap = new Map<number, number>();
  const subjectIdMap = new Map<number, number>();
  const lectureIdMap = new Map<number, number>();
  const quizIdMap = new Map<number, number>();
  const questionIdMap = new Map<number, number>();

  // Creator ID for migrated entities (set to NULL as users are not migrated)
  const defaultCreatorId = null;

  // --- Step 1: Insert Faculties and associated nested data ---
  console.log('📦 Inserting faculties and their nested data...');
  for (const faculty of v1Data) {
    const oldFacultyId = faculty.oldFacultyId;
    const insertFacultyResult = await v2.query(
      `INSERT INTO "Faculty" (name, city, "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
      [
        faculty.facultyName,
        faculty.facultyCity,
        faculty.facultyCreatedAt || new Date(),
        faculty.facultyUpdatedAt || new Date(),
        defaultCreatorId,
      ],
    );
    const newFacultyId = insertFacultyResult.rows[0].id;
    facultyIdMap.set(oldFacultyId, newFacultyId);
    console.log(
      `  🏛️ Inserted Faculty: ${faculty.facultyName} (Old ID: ${oldFacultyId}) with New ID: ${newFacultyId}`,
    );

    // Insert StudyingYears
    if (faculty.years) {
      for (const year of faculty.years) {
        const oldYearId = year.oldYearId;
        const insertYearResult = await v2.query(
          `INSERT INTO "StudyingYear" (title, "facultyId", "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5) RETURNING id;`,
          [
            year.yearTitle,
            newFacultyId,
            year.yearCreatedAt || new Date(),
            year.yearUpdatedAt || new Date(),
            defaultCreatorId,
          ],
        );
        const newYearId = insertYearResult.rows[0].id;
        yearIdMap.set(oldYearId, newYearId);
        console.log(
          `    🎓 Inserted Year: ${year.yearTitle} (Old ID: ${oldYearId}) with New ID: ${newYearId} for Faculty ${faculty.facultyName}`,
        );

        // Insert Modules
        if (year.modules) {
          for (const module of year.modules) {
            const oldModuleId = module.oldModuleId;
            const insertModuleResult = await v2.query(
              `INSERT INTO "Module" (name, "semesterName", icon, "yearId", "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;`,
              [
                module.moduleName,
                module.semesterName,
                module.icon,
                newYearId,
                module.moduleCreatedAt || new Date(),
                module.moduleUpdatedAt || new Date(),
                defaultCreatorId,
              ],
            );
            const newModuleId = insertModuleResult.rows[0].id;
            moduleIdMap.set(oldModuleId, newModuleId);
            console.log(
              `      📚 Inserted Module: ${module.moduleName} (Old ID: ${oldModuleId}) with New ID: ${newModuleId} for Year ${year.yearTitle}`,
            );

            // Insert Subjects
            if (module.subjects) {
              for (const subject of module.subjects) {
                const oldSubjectId = subject.oldSubjectId;
                const insertSubjectResult = await v2.query(
                  `INSERT INTO "Subject" (name, icon, "moduleId", "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`,
                  [
                    subject.subjectName,
                    subject.icon,
                    newModuleId,
                    subject.subjectCreatedAt || new Date(),
                    subject.subjectUpdatedAt || new Date(),
                    defaultCreatorId,
                  ],
                );
                const newSubjectId = insertSubjectResult.rows[0].id;
                subjectIdMap.set(oldSubjectId, newSubjectId);
                console.log(
                  `        📖 Inserted Subject: ${subject.subjectName} (Old ID: ${oldSubjectId}) with New ID: ${newSubjectId} for Module ${module.moduleName}`,
                );

                // Insert Lectures
                if (subject.lectures) {
                  for (const lecture of subject.lectures) {
                    const oldLectureId = lecture.oldLectureId;
                    const insertLectureResult = await v2.query(
                      `INSERT INTO "Lecture" (title, "subTitle", "subjectId", type, date, "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id;`,
                      [
                        lecture.lectureTitle,
                        lecture.lectureSubTitle || null,
                        newSubjectId,
                        lecture.lectureType,
                        lecture.lectureDate,
                        lecture.lectureCreatedAt || new Date(),
                        lecture.lectureUpdatedAt || new Date(),
                        defaultCreatorId,
                      ],
                    );
                    const newLectureId = insertLectureResult.rows[0].id;
                    lectureIdMap.set(oldLectureId, newLectureId);
                    // console.log(`          🧑‍🏫 Inserted Lecture: ${lecture.lectureTitle} (Old ID: ${oldLectureId}) with New ID: ${newLectureId} for Subject ${subject.subjectName}`);

                    // Insert LectureLinks
                    if (lecture.links) {
                      for (const link of lecture.links) {
                        await v2.query(
                          `INSERT INTO "LectureLink" (title, "subTitle", url, type, category, "lectureId", notifiable, "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id;`,
                          [
                            link.linkTitle,
                            link.linkSubTitle || null,
                            link.url,
                            link.type,
                            link.category,
                            newLectureId,
                            link.notifiable,
                            link.linkCreatedAt || new Date(),
                            link.linkUpdatedAt || new Date(),
                            defaultCreatorId,
                          ],
                        );
                        // console.log(`            🔗 Inserted Link: ${link.linkTitle}`);
                      }
                    }

                    // Insert Quizzes
                    if (lecture.mcqQuizzes) {
                      for (const quiz of lecture.mcqQuizzes) {
                        const oldQuizId = quiz.oldQuizId;
                        const insertQuizResult = await v2.query(
                          `INSERT INTO "Quiz" (title, "lectureId", notifiable, "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;`,
                          [
                            quiz.quizTitle,
                            newLectureId,
                            quiz.notifiable,
                            quiz.quizCreatedAt || new Date(),
                            quiz.quizUpdatedAt || new Date(),
                            defaultCreatorId,
                          ],
                        );
                        const newQuizId = insertQuizResult.rows[0].id;
                        quizIdMap.set(oldQuizId, newQuizId);
                        // console.log(`            📝 Inserted Quiz: ${quiz.quizTitle} (Old ID: ${oldQuizId}) with New ID: ${newQuizId}`);

                        // Insert Questions
                        if (quiz.questions) {
                          for (const question of quiz.questions) {
                            const oldQuestionId = question.oldQuestionId;
                            const insertQuestionResult = await v2.query(
                              `INSERT INTO "Question" (text, image, explanation, options, "correctOptionIndex", "quizId", "createdAt", "updatedAt", "creatorId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;`,
                              [
                                question.text,
                                question.image,
                                question.explanation,
                                question.options,
                                question.correctOptionIndex,
                                newQuizId,
                                question.questionCreatedAt || new Date(),
                                question.questionUpdatedAt || new Date(),
                                defaultCreatorId,
                              ],
                            );
                            const newQuestionId =
                              insertQuestionResult.rows[0].id;
                            questionIdMap.set(oldQuestionId, newQuestionId);
                            // console.log(
                            //   `              ❓ Inserted Question (Old ID: ${oldQuestionId}) with New ID: ${newQuestionId}`,
                            // );
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('🎉 Data migration completed successfully!');

  await v1.end();
  await v2.end();
}

main().catch(err => {
  console.error('❌ Error during migration:', err);
  v1.end();
  v2.end();
});
