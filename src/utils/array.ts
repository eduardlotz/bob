export const safeArrayTransform = <T>(
  array: T[] | undefined,
  transform: (item: T, index: number) => T
): T[] | undefined => {
  if (!Array.isArray(array)) return array;
  return array.map(transform);
};
