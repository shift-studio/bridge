import shallowEqual from './shallow-equal';

/**
 * areKeysEqual - compares two components keys
 *
 * @param {Array} keys1
 * @param {Array} keys2
 *
 * @return {Boolean} true if they are equal
 */
function areKeysEqual(keys1, keys2) {
  if (keys1 === keys2 || (!keys1 && !keys2)) {
    return true;
  }

  const k1 = keys1 || [];
  const k2 = keys2 || [];

  if (k1.length !== k2.length) {
    return false;
  }

  return k1.map((k) => k.key).join() === k2.map((k) => k.key).join();
}

/**
 * areRootInstancesEqual - compares two components root instances array
 *
 * @param {Array} inst1
 * @param {Array} inst2
 *
 * @return {Boolean} true if they are equal
 */
function areRootInstancesEqual(inst1, inst2) {
  if (inst1 === inst2 || (!inst1 && !inst2)) {
    return true;
  }

  const k1 = inst1 || [];
  const k2 = inst2 || [];

  if (k1.length !== k2.length) {
    return false;
  }

  return shallowEqual(k1, k2);
}

export default function areSelectionsEqual(sel1, sel2, noKeys) {
  if (!sel1 || !sel2) {
    return false;
  }

  return (
    sel1.id === sel2.id &&
    areRootInstancesEqual(sel1.rootInstances, sel2.rootInstances) &&
    (noKeys || areKeysEqual(sel1.keys, sel2.keys))
  );
}
