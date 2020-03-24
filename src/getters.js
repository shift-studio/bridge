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

/**
 * getClutchProps - calculates clutch props for a given component
 *
 * @param {String} instanceId
 *
 * @return {Object|undefined}
 */
export function getClutchProps(
  instanceId,
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

      childrenOverrides[resId] = [
        ...(childrenOverrides[resId] || []),
        overrides[id],
      ];
    });
  }

  return {
    selection: {
      id: instanceId,
      rootInstances,
      keys: childrenKeys,
    },
    flowProps,
    overrides: childrenOverrides,
  };
}

/**
 * getOverrides - calculates overrides based of incoming props
 *
 * @param {Object} props
 *
 * @return {Object|undefined}
 */
function getOverrides(props) {
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
 * getInstanceProps
 *
 * @return {Object|undefined}
 */
export function getInstanceProps({
  id,
  masterProps,
  flowProps,
  key,
  parentSelection,
  props,
  overrides,
}) {
  const masterClutchProps = get(masterProps, ['clutchProps'], {});
  const instanceClutchProps = getClutchProps(
    id,
    masterClutchProps,
    flowProps,
    key,
    parentSelection,
    overrides,
  );

  const instanceOverrides = getOverrides(instanceClutchProps);

  // merge props and overrides
  // [overrideParent, override1, props]
  let resultProps = {};

  [...(instanceOverrides || []), props].forEach((propsFn) => {
    resultProps = propsFn(resultProps, instanceClutchProps.selection);
  });

  // bind functions to this instance context
  resultProps = Object.entries(resultProps).reduce((acc, [k, val]) => {
    if (
      typeof val === 'function' &&
      (!val.prototype || !val.prototype.isReactComponent)
    ) {
      return {
        ...acc,
        [k]: val.bind({ masterProps, flowProps }),
      };
    }

    return acc;
  }, resultProps);

  return { ...resultProps, clutchProps: instanceClutchProps };
}
