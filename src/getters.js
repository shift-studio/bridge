import get from 'lodash/get';
import getSelectionUID from './helpers/get-selection-uid';

/**
 * getUniqueClassName - Gets an unique classname for a given selection and propName
 *
 * @param {Object} selection
 * @param {String} propName
 *
 * @returns {String} unique css class name
 */
export function getUniqueClassName(selection, propName) {
  let result;

  if (typeof window !== 'undefined' && window.CLUTCH_CLASSES_MAP) {
    const uid = getSelectionUID(selection);

    if (window.CLUTCH_CLASSES_MAP[`${uid}${propName}`] === undefined) {
      result = `-clutch-identifier${
        Object.keys(window.CLUTCH_CLASSES_MAP).length
      }`;
      window.CLUTCH_CLASSES_MAP[`${uid}${propName}`] = result;
    } else {
      result = window.CLUTCH_CLASSES_MAP[`${uid}${propName}`];
    }
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
 * propertyBind - calculates a property bind
 *
 * @param {Array} value
 * @param {String*} suffix
 *
 * @returns {*}
 */
export function propertyBind(value, suffix) {
  let result;

  try {
    result = get(this, value);

    if (result !== undefined && suffix) {
      result += suffix;
    }
  } catch (err) {
    // ignore bind error
  }

  return result;
}
