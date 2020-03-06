/* eslint-disable no-restricted-globals, no-eval, global-require, import/no-dynamic-require */
import cx from 'classnames';
import get from 'lodash/get';
import getSelectionUID from './helpers/get-selection-uid';

export const classnames = cx;

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

const getCircularReplacer = () => {
  const seen = new WeakSet();

  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return undefined;
      }

      seen.add(value);
    }

    if (typeof value === 'function') {
      return value.toString();
    }

    if (
      typeof value === 'object' &&
      value !== undefined &&
      value !== null &&
      value.constructor &&
      value.constructor.name.includes('HTML')
    ) {
      return `<${value.constructor.name}>`;
    }

    return value;
  };
};

export function getClutchProps(
  instanceId,
  masterProps,
  flowProps,
  key,
  parentSelection,
  overrides,
) {
  const masterSelection = get(masterProps, ['clutchProps', 'selection'], {});

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
  let childrenOverrides = get(masterProps, ['clutchProps', 'overrides']);

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
    parentSelection,
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
 * @param {*} value
 * @param {String*} suffix
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
 * changeComponentProp - Changes a component prop
 *
 * @param {Object} selection
 * @param {String} propName
 * @param {*} value
 */
export function changeComponentProp(selection, propName, value) {
  sendMessage({
    type: 'changeComponentProp',
    selection,
    propName,
    value,
  });
}
