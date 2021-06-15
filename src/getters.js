import get from 'lodash/get';

/**
 * getUniqueClassName - Gets an unique classname for a given selection and propName
 *
 * @param {Object} selection
 * @param {String} propName
 *
 * @returns {String} unique css class name
 */
let classNamesCounter = 0;
export function getUniqueClassName() {
  let result;

  // eslint-disable-next-line
  if (typeof window !== 'undefined' && window.__CLUTCH_INSPECTOR__) {
    result = `-clutch-identifier${classNamesCounter}`;

    classNamesCounter += 1;
  }

  return result;
}

/**
 * getVariants - Merges variants maps
 *
 * @param {Object} variantsMap
 *
 * @returns {Array} variants list
 */
export function getVariants(variantsMap) {
  let result = variantsMap;

  if (result !== undefined) {
    result = Object.keys(variantsMap).reduce((acc, variantName) => {
      if (variantsMap[variantName]) {
        return [...acc, variantName];
      }

      return acc;
    }, []);
  }

  return result;
}

/**
 * hasVariant - calculates if a variants list contains a variant
 *
 * @param {Array} variants
 * @param {String} variant
 *
 * @return {true|undefined}
 */
export function hasVariant(variants, variant) {
  return variants && Array.isArray(variants) && variants.includes(variant)
    ? true
    : undefined;
}

/**
 * tryCatch - tries to run the passed fn
 *
 * @param {Function} fn
 *
 * @returns {*}
 */
export function tryCatch(fn) {
  let result;

  try {
    result = fn();
  } catch (err) {
    // ignore error
  }

  return result;
}

/**
 * propertyBind - calculates a property bind
 *
 * @param {Array} value
 * @param {String*} suffix
 *
 * @returns {*}
 */
export function propertyBind(obj, value, suffix) {
  let result;

  try {
    result = get(obj, value);

    if (result !== undefined && suffix) {
      result += suffix;
    }
  } catch (err) {
    // ignore bind error
  }

  return result;
}
