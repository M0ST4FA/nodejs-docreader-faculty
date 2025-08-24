export default function buildInclude(input: string) {
  const paths = input.split(',').map(p => p.trim());
  const result: any = {};

  for (const path of paths) {
    const parts = path.split('.');
    let current = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // If this is the last part, set to true
      if (i === parts.length - 1) {
        if (
          current[part] &&
          typeof current[part] === 'object' &&
          current[part].select
        ) {
          // If already an object with select, do nothing (keep nested)
        } else {
          current[part] = true;
        }
      } else {
        // If current[part] is true (was a leaf before, now needs to be nested)
        if (current[part] === true) {
          current[part] = { select: {} };
        } else if (!current[part]) {
          current[part] = { select: {} };
        }
        current = current[part].select;
      }
    }
  }

  return result;
}
