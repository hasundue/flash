interface KeyUtilOptions {
  seperator: string;
  prefix?: string;
  suffix?: string;
}

export function joinKeys(
  record: Record<string, unknown>,
  options: KeyUtilOptions,
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
