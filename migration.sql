DO $$
DECLARE
  old_quiz_id INT := 31;
  new_quiz_id INT;
  question_record RECORD;
  new_question_id INT;
BEGIN
  -- Insert the quiz into the new table
  INSERT INTO "WrittenQuiz" ("lectureId", title, notifiable, "createdAt", "updatedAt")
  SELECT "lectureId", title, notifiable, "createdAt", "updatedAt"
  FROM old_schema."PracticalQuiz"
  WHERE id = old_quiz_id
  RETURNING id INTO new_quiz_id;

  -- Loop over the old questions and transfer them, along with their related data
  FOR question_record IN
    SELECT * FROM old_schema."PracticalQuestion" WHERE "quizId" = old_quiz_id
  LOOP
    -- Insert the question into the new table
    INSERT INTO "WrittenQuestion" ("quizId", image, width, height, "createdAt", "updatedAt")
    VALUES (new_quiz_id, question_record.image, question_record.width, question_record.height, question_record."createdAt", question_record."updatedAt")
    RETURNING id INTO new_question_id;

    -- Transfer tape rects
    INSERT INTO "Rect" ("tapeQuestionId", x, y, w, h, "createdAt", "updatedAt")
    SELECT new_question_id, x, y, w, h, "createdAt", "updatedAt"
    FROM old_schema."Rect"
    WHERE "tapeQuestionId" = question_record.id;

    -- Transfer mask rects
    INSERT INTO "Rect" ("maskQuestionId", x, y, w, h, "createdAt", "updatedAt")
    SELECT new_question_id, x, y, w, h, "createdAt", "updatedAt"
    FROM old_schema."Rect"
    WHERE "maskQuestionId" = question_record.id;

    -- Transfer written questions as subquestions
    INSERT INTO "SubQuestion" ("questionId", text, answer, "createdAt", "updatedAt")
    SELECT new_question_id, text, answer, "createdAt", "updatedAt"
    FROM old_schema."WrittenQuestion"
    WHERE "questionId" = question_record.id;
  END LOOP;
END $$;