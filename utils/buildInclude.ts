export default function buildInclude(input: string) {
  const paths = input.split(',').map(p => p.trim());

  const result = {};

  for (const path of paths) {
    const parts = path.split('.');
    let current: any = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      // Special case: top-level "questions" uses "include"
      const containerKey =
        i === 0 && part === 'questions' ? 'include' : 'select';

      if (isLast) {
        if (part === 'subQuestions') current[part] = { orderBy: { id: 'asc' } };
        else current[part] = true;
      } else {
        // Ensure property exists and is an object with the correct container
        if (!current[part] || current[part] === true) {
          if (containerKey === 'include') {
            current[part] = {
              orderBy: { id: 'asc' },
              [containerKey]: {},
            };
          } else {
            current[part] = { [containerKey]: {} };
          }
        }
        // If it exists but has no containerKey, add it
        if (!current[part][containerKey]) {
          current[part][containerKey] = {};
        }
        current = current[part][containerKey];
      }
    }
  }

  return result;
}
