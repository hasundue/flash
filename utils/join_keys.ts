export function joinKeys(
  record: Record<string, unknown>,
  options: {
    prefix: string;
    seperator: string;
  },
): string {
  const { prefix, seperator } = options;
  let result = prefix;
  for (const key in record) {
    result += seperator + record[key];
  }
  return result;
}
