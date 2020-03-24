/* eslint-disable import/prefer-default-export */
import sendMessage from './helpers/send-message';

/**
 * changeComponentProp - Changes a component prop
 *
 * @param {Object} selection
 * @param {String} propName
 * @param {*} value
 *
 * @returns {undefined}
 */
export function changeComponentProp(selection, propName, value) {
  sendMessage({
    type: 'changeComponentProp',
    selection,
    propName,
    value,
  });
}
