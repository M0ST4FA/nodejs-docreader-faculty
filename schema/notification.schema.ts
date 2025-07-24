import z from 'zod';

const fullSchema = z
  .object({
    notification: z
      .object(
        {
          title: z
            .string()
            .trim()
            .min(1, { message: 'Notification title is required.' })
            .optional(),
          body: z
            .string()
            .trim()
            .min(1, { message: 'Notification body is required.' })
            .optional(),
          imageUrl: z
            .string()
            .url({ message: 'Invalid notification image URL.' })
            .optional(),
        },
        { message: 'Notification object is required.' },
      )
      .strict(),
    data: z.object({}).default({}).optional(),
  })
  .strict();

export default fullSchema;
