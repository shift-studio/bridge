/* eslint-disable no-restricted-globals, no-eval, global-require, import/no-dynamic-require */
import cx from 'classnames';
import get from 'lodash/get';
import getCircularReplacer from './helpers/circular-replacer';
import getSelectionUID from './helpers/get-selection-uid';

export const classnames = cx;

/**
 * sendMessage - Sends a message to clutch IDE
 *
 * @param {Object} data
 *
 * @returns {undefined}
 */
function sendMessage(data) {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const dataStr = JSON.stringify(data, getCircularReplacer());

    if (window.opener) {
      window.opener.postMessage(dataStr, '*');
    } else {
      window.parent.postMessage(dataStr, '*');
    }
  }
}

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
 * mergeProperty - Merges two property values
 *
 * @param {*} valueA
 * @param {<*>} ...oterhValues
 *
 * @returns {*} resulting value
 */
export function mergeProperty(valueA, ...otherValues) {
  let result = valueA;

  otherValues.forEach((nextValue) => {
    if (nextValue !== undefined) {
      if (nextValue && nextValue.className && nextValue.style) {
        result = {
          className: cx(
            result && result.className,
            nextValue && nextValue.className,
          ),
          style: Object.assign(
            {},
            result && result.style,
            nextValue && nextValue.style,
          ),
        };
      } else {
        result = nextValue;
      }
    }
  });

  return result;
}

/**
 * mergeVariants - Merges variants maps
 *
 * @param {Object} variantsA
 * @param {<Object>} ...otherVariants
 *
 * @returns {Array} variants list
 */
export function mergeVariants(variantsA, ...otherVariants) {
  let map = Object.assign({}, variantsA);

  if (otherVariants && otherVariants.length) {
    otherVariants.forEach((variantsB) => {
      map = Object.assign({}, map, variantsB);
    });
  }

  return Object.keys(map).reduce((acc, variantName) => {
    if (map[variantName]) {
      return [...acc, variantName];
    }

    return acc;
  }, []);
}

/**
 * mergeComponentProperties - Merges component private with public properties
 *
 * @param {Object} propsA
 * @param {Object} ...
 */
export function mergeProperties(propsA, ...otherProps) {
  const result = Object.assign({}, propsA);

  if (otherProps && otherProps.length) {
    otherProps.forEach((propsB) => {
      if (propsB && typeof propsB === 'object') {
        Object.keys(propsB).forEach((propName) => {
          const prevValue = result[propName];
          const nextValue = propsB[propName];

          if (propName === 'variants') {
            if (nextValue && nextValue.length) {
              result.variants = [...(prevValue || [])];

              nextValue.forEach((v) => {
                if (
                  v &&
                  typeof v === 'string' &&
                  !result.variants.includes(v)
                ) {
                  result.variants.push(v);
                }
              });
            }
          } else if (propName === 'clutchProps') {
            // merge overrides
            if (prevValue && nextValue && nextValue.overrides) {
              const newOverrides = prevValue.overrides || {};

              Object.keys(nextValue.overrides).forEach((id) => {
                newOverrides[id] = mergeProperties(
                  newOverrides[id],
                  nextValue.overrides[id],
                );
              });

              result[propName] = Object.assign({}, prevValue, nextValue, {
                overrides: newOverrides,
              });
            } else {
              result[propName] = Object.assign({}, prevValue, nextValue);
            }
          } else {
            result[propName] = mergeProperty(prevValue, nextValue);
          }
        });
      }
    });
  }

  return result;
}

/**
 * mergeOverrides - merge properties overrides
 *
 * @param {Object} overridesA
 * @param {Object} overridesB ...
 *
 * @returns {Object}
 */
export function mergeOverrides(overrideA, ...otherOverrides) {
  const result = Object.assign({}, overrideA);

  otherOverrides.forEach((overrideB) => {
    if (overrideB) {
      Object.keys(overrideB).forEach((overridePath) => {
        result[overridePath] = mergeProperties(
          result[overridePath],
          overrideB[overridePath],
        );
      });
    }
  });

  return result;
}

/**
 * getOverrides - calculates overrides based of incoming props
 *
 * @param {Object} props
 *
 * @return {Object|undefined}
 */
export function getOverrides(props) {
  let result;

  const selection = get(props, ['clutchProps', 'selection']);
  const overrides = get(props, ['clutchProps', 'overrides']);

  if (selection && overrides) {
    const rootInstances = selection.rootInstances || [];
    const pathId = `${rootInstances.join('.')}.${selection.id}`;

    // might resolve to an overrides object or undefined
    result = overrides[pathId];
  }

  return result;
}

/**
 * getClutchProps - calculates clutch props for a given component
 *
 * @param {String} instanceId
 *
 * @return {Object|undefined}
 */
export function getClutchProps(
  instanceId,
  masterProps,
  masterClutchProps,
  flowProps,
  key,
  parentSelection,
  overrides,
) {
  const masterSelection = get(masterClutchProps, ['selection'], {});

  if (!parentSelection) {
    // eslint-disable-next-line no-console
    console.log(
      'Missing parentSelection, this might happen when you dont use useClutch to get properties',
    );
  }

  // keys for replicated items
  let childrenKeys = (parentSelection && parentSelection.keys) || [];
  if (key !== undefined && parentSelection) {
    childrenKeys = [
      ...childrenKeys,
      {
        componentId: parentSelection.id,
        key,
      },
    ];
  }

  // root instances calc
  let rootInstances = masterSelection.rootInstances || [];
  if (!masterSelection.rootInstances) {
    // entry component, we don't want root instances added here
    rootInstances = [];
  } else {
    rootInstances = [...rootInstances, masterSelection.id];
  }

  // overrides calc
  let childrenOverrides = get(masterClutchProps, ['overrides']);

  if (overrides) {
    // merge this one with previous
    childrenOverrides = Object.assign({}, childrenOverrides);
    const hasRoots = rootInstances && rootInstances.length;

    Object.keys(overrides).forEach((id) => {
      let resId = id;

      // we need to map overrides with incoming root instances
      if (hasRoots) {
        resId = `${rootInstances.join('.')}.${id}`;
      }

      if (childrenOverrides[resId]) {
        childrenOverrides[resId] = mergeProperties(
          overrides[id],
          childrenOverrides[resId],
        );
      } else {
        childrenOverrides[resId] = overrides[id];
      }
    });
  }

  return {
    selection: {
      id: instanceId,
      rootInstances,
      keys: childrenKeys,
    },
    masterProps,
    flowProps,
    overrides: childrenOverrides,
  };
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
export function renderChildren(
  selection,
  flowProps,
  propName,
  value,
  newFlowProps,
  key,
) {
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
 * calculateProperties
 *
 * @param {Object} defaultSelection
 * @param {Object} propsTypes
 * @param {Object} privateProps
 * @param {Object} props
 */
export function getFlowProps(props) {
  return get(props, ['clutchProps', 'flowProps'], {});
}

/**
 * calculateProperties
 *
 * @param {Object} defaultSelection
 * @param {Object} propsTypes
 * @param {Object} privateProps
 * @param {Object} props
 */
export function calculateProperties({
  defaultSelection,
  propsTypes,
  privateProps,
  props,
}) {
  const overrides = getOverrides(props);
  let resultProps = mergeProperties(privateProps, props, overrides);

  // coherse
  const clutchProps = (resultProps && resultProps.clutchProps) || {};
  const { masterProps, flowProps } = clutchProps;
  const selection = defaultSelection || clutchProps.selection;

  // convert children to render clutch children calls
  resultProps = Object.entries(propsTypes).reduce(
    (acc, [propName, propType]) => {
      const val = resultProps[propName];

      if (propType === 'Children') {
        return {
          ...acc,
          [propName]: renderChildren.bind(
            this,
            selection,
            flowProps,
            propName,
            val,
          ),
        };
      }

      if (propType === 'Styles' && process.env.NODE_ENV !== 'production') {
        const identifier = getUniqueClassName(selection, propName);

        return {
          ...acc,
          [propName]: {
            className: classnames(val && val.className, identifier),
            style: (val && val.style) || {},
          },
        };
      }

      return acc;
    },
    resultProps,
  );

  // bind functions to this instance context
  resultProps = Object.entries(resultProps).reduce((acc, [key, val]) => {
    if (
      typeof val === 'function' &&
      (!val.prototype || !val.prototype.isReactComponent)
    ) {
      return {
        ...acc,
        [key]: val.bind({ masterProps, flowProps }),
      };
    }

    return acc;
  }, resultProps);

  return {
    masterProps: resultProps,
    clutchProps,
  };
}

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
