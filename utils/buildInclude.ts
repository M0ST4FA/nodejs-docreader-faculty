export default function buildInclude(input: string) {
  const paths = input.split(',').map(p => p.trim());

  const result = {};

  for (const path of paths) {
    const parts = path.split('.');
    let current: any = result;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Create object if doesn't exist
      if (!current[part]) {
        current[part] = {};
      }

      if (i === parts.length - 1) {
        // Last segment: mark as true in `select`
        current[part] = true;
      } else {
        // Ensure we're inside a "select" object
        if (!current[part].select) {
          current[part].select = {};
        }
        current = current[part].select;
      }
    }
  }

  return result;
}
