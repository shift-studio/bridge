export default function getSelectionUID(selection) {
  const { id, keys, rootInstances } = selection || {};
  let uuid = `${id}`;

  if (keys && keys.length) {
    uuid += `.${keys.map((k) => k.key).join('.')}`;
  }

  if (rootInstances && rootInstances.length) {
    uuid += `.${rootInstances.join('.')}`;
  }

  return uuid;
}
