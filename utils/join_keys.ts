interface KeyUtilOptions {
  seperator: string;
  prefix?: string;
  suffix?: string;
}

function joinKeys(
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

function splitKey(
  joined: string,
  fields: 
  options: KeyUtilOptions,
): Record<string, unknown> {
  const strs = joined.split(options.seperator);
  return Object.fromEntries(
}

export function keyUtils(options: KeyUtilOptions) {
  return {
    join: (keys: Record<string, unknown>) => joinKeys(keys, options),
  };
}
