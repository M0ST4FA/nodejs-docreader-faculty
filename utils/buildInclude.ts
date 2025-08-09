export default function buildInclude(input: string) {
  const parts = input.split(',').map(p => p.trim());

  const result: any = {};

  for (const path of parts) {
    const keys = path.split('.');
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (i === keys.length - 1) {
        // Last key — set it to true
        if (current.select) {
          current.select[key] = true;
        } else {
          current[key] = true;
        }
      } else {
        if (!current[key]) {
          current[key] = {};
        }

        // If this key should use `select`
        if (!current[key].select) {
          current[key].select = {};
        }

        current = current[key].select;
      }
    }
  }

  // Special override for "questions" 😐
  if (result.questions === true) {
    result.questions = {
      orderBy: { id: 'asc' },
    };
  }

  return result;
}
