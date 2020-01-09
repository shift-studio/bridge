/* eslint-disable no-restricted-syntax, guard-for-in */
const hasOwn = Object.prototype.hasOwnProperty;

export default function shallowEqual(a, b, comp) {
  if (a === b) return true;
  if ((a && !b) || (b && !a)) return false;

  let countA = 0;
  let countB = 0;

  for (const key in a) {
    if (
      hasOwn.call(a, key) &&
      (comp ? !comp(a[key], b[key]) : a[key] !== b[key])
    )
      return false;
    countA += 1;
  }

  for (const key in b) {
    if (hasOwn.call(b, key)) countB += 1;
  }

  return countA === countB;
}
