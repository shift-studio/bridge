import getCircularReplacer from './helpers/circular-replacer';

/**
 * sendMessage - Sends a message to clutch IDE
 *
 * @param {Object} data
 *
 * @returns {undefined}
 */
export default function sendMessage(data) {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const dataStr = JSON.stringify(data, getCircularReplacer());

    if (window.opener) {
      window.opener.postMessage(dataStr, '*');
    } else {
      window.parent.postMessage(dataStr, '*');
    }
  }
}
