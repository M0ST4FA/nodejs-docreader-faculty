import z from 'zod';

const fullSchema = {
  action: z.object({
    links: z.array(z.number()),
    mcqQuizzes: z.array(z.number()),
    practicalQuizzes: z.array(z.number()),
  }),
};

export default fullSchema;
