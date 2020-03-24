import cx from 'classnames';

/**
 * mClassnames - Merges class names
 *
 * @param {*} valueA
 * @param {<*>} ...oterhValues
 *
 * @returns {*} resulting value
 */
export const mClassnames = cx;

/**
 * mergeProperty - Merges two property values
 *
 * @param {*} valueA
 * @param {<*>} ...oterhValues
 *
 * @returns {*} resulting value
 */
export function mReplace(valueA, ...otherValues) {
  let result = valueA;

  otherValues.forEach((nextValue) => {
    if (nextValue !== undefined) {
      result = nextValue;
    }
  });

  return result;
}

/**
 * mAssign
 *
 * @param {*} valueA
 * @param {<*>} ...oterhValues
 *
 * @returns {*} resulting value
 */
export function mAssign(...otherValues) {
  return Object.assign({}, ...otherValues);
}
