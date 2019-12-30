/**
 * Convert collection to map
 *
 * @param {Array} arr collection
 * @return {Object} map ID -> item
 */
export default (arr, prop = '_id') => {
  const map = {};

  for (let i = 0; i < arr.length; i += 1) {
    const item = arr[i];
    map[item[prop]] = item;
  }

  return map;
};
