/**
 * renderChildren - Render children method
 *
 * @param {Object} selection
 * @param {Object} flowProps
 * @param {String} propName
 * @param {*} value
 * @param {?Object} newFlowProps
 * @param {String} key
 */
export function renderChildren(selection, flowProps, value, newFlowProps, key) {
  let result = value;
  let childrenFlowProps = flowProps || {};

  if (newFlowProps) {
    childrenFlowProps = Object.assign({}, childrenFlowProps, newFlowProps);
  }

  if (typeof value === 'function') {
    result = value(childrenFlowProps, key, selection);
  } else if (value === undefined) {
    result = null;
  }

  return result;
}

/**
 * childrenFn
 */
export function childrenFn(value, selection, flowProps) {
  return value === undefined
    ? undefined
    : renderChildren.bind(this, selection, flowProps, value);
}

/**
 * childrenVal
 */
export function childrenVal(value, selection, flowProps) {
  return renderChildren.bind(this, selection, flowProps, value)();
}
