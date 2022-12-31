export function joinKeys(
  record: Record<string, unknown>,
  options: {
    seperator: string;
    prefix?: string;
    suffix?: string;
  },
): string {
  const { prefix, suffix, seperator } = options;
  let result = prefix ?? "";

  for (const key in record) {
    result += seperator + record[key];
  }
  if (suffix) {
    result += seperator + suffix;
  }
  return result;
}
