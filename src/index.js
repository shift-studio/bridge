/* eslint-disable no-restricted-globals, no-eval, global-require, import/no-dynamic-require */
import findIndex from 'lodash/findIndex';
import find from 'lodash/find';
import cx from 'classnames';
import get from 'lodash/get';
import shallowEqual from './helpers/shallow-equal';
import getSelectionUID from './helpers/get-selection-uid';
import ShiftBridgeComponent from './component';

export const classnames = cx;

export function getUniqueClassName(selection, propName) {
  let result;

  if (typeof window !== 'undefined' && window.SHIFT_CLASSES_MAP) {
    const uid = getSelectionUID(selection);

    if (window.SHIFT_CLASSES_MAP[`${uid}${propName}`] === undefined) {
      result = `-shift-identifier${
        Object.keys(window.SHIFT_CLASSES_MAP).length
      }`;
      window.SHIFT_CLASSES_MAP[`${uid}${propName}`] = result;
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
          } else if (propName === 'shiftProps') {
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

  Object.keys(otherOverrides).forEach((overrideB) => {
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

  const selection = get(props, ['shiftProps', 'selection']);
  const overrides = get(props, ['shiftProps', 'overrides']);

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
    } else if (typeof value === 'function') {
      return value.toString();
    }

    return value;
  };
};

export function getShiftProps(
  instanceId,
  masterProps,
  flowProps,
  key,
  parentSelection,
  overrides,
) {
  const masterSelection = get(masterProps, ['shiftProps', 'selection'], {});

  // keys for replicated items
  let childrenKeys = parentSelection.keys || [];
  if (key !== undefined) {
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
  let childrenOverrides = get(masterProps, ['shiftProps', 'overrides']);

  if (overrides) {
    // merge this one with previous
    childrenOverrides = Object.assign({}, childrenOverrides);
    const hasRoots =
      masterSelection.rootInstances && masterSelection.rootInstances.length;

    Object.keys(overrides).forEach((id) => {
      let resId = id;

      // we need to map overrides with incoming root instances
      if (hasRoots) {
        resId = `${masterSelection.rootInstances.join('.')}.${id}`;
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

class ShiftBridge {
  shallowEqual = shallowEqual;

  getSelectionUID = getSelectionUID;

  constructor() {
    this.registeredComponents = [];
    this.editing = false;

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.onReceivedMessage, false);
      window.requestAnimationFrame(this.checkComponentsRects);

      this.sendMessage({
        type: 'getEditing',
      });
    }
  }

  sendMessage(data) {
    if (
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined'
    ) {
      const dataStr = JSON.stringify(data, getCircularReplacer());

      if (window.opener) {
        window.opener.postMessage(dataStr, '*');
      } else {
        window.parent.postMessage(dataStr, '*');
      }
    }
  }

  onReceivedMessage = (evt) => {
    if (typeof evt.data === 'string') {
      const { type, ...data } = JSON.parse(evt.data);

      switch (type) {
        case 'setComponentState':
          this.setComponentState(data.selection, data.state);
          break;
        case 'setEditing':
          this.setEditing(data.editing);
          break;
        case 'request-binds-resolve':
          this.resolveBinds(data.selection, data.binds);
          break;
        default:
          break;
      }
    }
  };

  setEditing = (editing) => {
    this.editing = editing;
  };

  checkComponentsRects = () => {
    if (typeof window !== 'undefined') {
      this.registeredComponents.forEach((bridgeComponent) =>
        bridgeComponent.updateRect(),
      );
      window.requestAnimationFrame(this.checkComponentsRects);
    }
  };

  removeWindowListener() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.checkComponentsRects);
    }
  }

  unlistenStructure() {
    if (this.observerBody) {
      this.observerBody.disconnect();
      delete this.observerBody;
    }
  }

  destroy() {
    this.unlistenStructure();
  }

  propertyBind(value, suffix) {
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

  resolveBinds(selection, binds) {
    const bridgeComponent = this.findComponentBySelection(selection);

    if (bridgeComponent) {
      const resolvedBinds = binds.map((value) => ({
        ...value,
        bind: this.processBind(
          value.bind,
          bridgeComponent.flowProps,
          bridgeComponent.masterProps,
        ),
      }));

      const response = {
        type: 'return-binds-resolve',
        id: this.getSelectionUID(selection),
        binds: resolvedBinds,
      };

      this.sendMessage(response);
    }
  }

  processBind(valueRaw, flowProps, masterProps) {
    let result = valueRaw;

    try {
      if (valueRaw.type === 'PROP') {
        result = get({ flowProps, masterProps }, valueRaw.value);

        if (result !== undefined && valueRaw.suffix) {
          result += valueRaw.suffix;
        }
      } else if (valueRaw.type === 'EXPRESSION') {
        const bind = `(function () {
          return ${valueRaw.value};
        })`;

        result = window.eval(bind).call({
          flowProps,
          masterProps,
        });
      } else if (valueRaw.type === 'MODULE') {
        const bind = require(valueRaw.path).default;
        result = window.eval(bind).call({
          flowProps,
          masterProps,
        });
      }
    } catch (err) {
      result = { type: '__SHIFT_ERROR__', message: err.message };
    }

    return result;
  }

  /**
   * registerComponent - Registers a new visible component
   *
   * @param {Object} selection
   */
  registerComponent(
    selection,
    parentSelection,
    masterProps,
    updateComponentCallback,
    setState,
  ) {
    // check if previous mounted instance
    const index = this.findComponentIndexBySelection(selection);

    const bridgeComponent = new ShiftBridgeComponent(
      this,
      selection,
      parentSelection,
      masterProps,
      updateComponentCallback,
      setState,
    );

    if (index !== -1) {
      // remove it (note that unregister will be eventually called)
      // this happens when moving components upwards in the tree
      // these call register of the new one before the unregister
      this.registeredComponents.splice(index, 1);
      bridgeComponent.prevUnregistered = true;
    }

    this.registeredComponents.unshift(bridgeComponent);

    this.sendMessage({
      type: 'registerComponent',
      selection,
    });
  }

  /**
   * unregisterComponent - Unregisters a visible component
   *
   * @param {Object} selection
   */
  unregisterComponent(selection) {
    const index = this.findComponentIndexBySelection(selection);

    if (index !== -1) {
      const bridgeComponent = this.registeredComponents[index];

      if (!bridgeComponent.prevUnregistered) {
        this.registeredComponents.splice(index, 1);
      } else {
        delete bridgeComponent.prevUnregistered;
      }
    }

    this.sendMessage({ type: 'unregisterComponent', selection });
  }

  /**
   * findComponentIndexBySelection - Finds an ide component index from a selection
   *
   * @param {Object} selection
   */
  findComponentIndexBySelection(selection) {
    return findIndex(this.registeredComponents, (bridgeComponent) =>
      bridgeComponent.matchesSelection(selection),
    );
  }

  /**
   * findComponentBySelection - Finds an ide component from a selection
   *
   * @param {Object} selection
   */
  findComponentBySelection(selection) {
    return find(this.registeredComponents, (bridgeComponent) =>
      bridgeComponent.matchesSelection(selection),
    );
  }

  /**
   * findComponentIndexBySelection - Finds an ide component index from a selection
   *
   * @param {Object} selection
   */
  findComponentsBySelection(selection, noKeys = false) {
    return this.registeredComponents.filter((bridgeComponent) =>
      bridgeComponent.matchesSelection(selection, noKeys),
    );
  }

  /**
   * changeComponentProp - Changes a component prop
   *
   * @param {Object} selection
   * @param {String} propName
   * @param {*} value
   */
  changeComponentProp(selection, propName, value) {
    this.sendMessage({
      type: 'changeComponentProp',
      selection,
      propName,
      value,
    });
  }

  /**
   * overComponent - Sets a component as overed
   *
   * @param {Object} selection
   */
  overComponent(selection) {
    this.sendMessage({ type: 'overComponent', selection });
  }

  /**
   * outComponent - Unsets a component as overed
   *
   * @param {Object} selection
   */
  outComponent(selection) {
    this.sendMessage({ type: 'outComponent', selection });
  }

  /**
   * selectComponent - Selects a component
   *
   * @param {Object} selection
   */
  selectComponent(selection) {
    this.sendMessage({ type: 'selectComponent', selection });
  }

  /**
   * unlockComponent - Unlocks a component
   *
   * @param {Object} selection
   */
  unlockComponent(selection) {
    this.sendMessage({ type: 'unlockComponent', selection });
  }

  /**
   * registerComponentReference - Register a component dom reference
   *
   * @param {Object} selection
   * @param {Object} DOMElement
   */
  registerComponentReference(selection, domElement) {
    const bridgeComponent = this.findComponentBySelection(selection);

    if (bridgeComponent && domElement !== null) {
      bridgeComponent.setReference(domElement);
    }
  }

  /**
   * registerComponentChildReference - Register a component child dom reference
   *
   * @param {Object} selection
   * @param {Object} DOMElement
   */
  registerComponentChildReference(selection, childSelection, domElement) {
    const bridgeComponent = this.findComponentBySelection(selection);

    if (bridgeComponent) {
      bridgeComponent.setChildReference(childSelection, domElement);
    }
  }

  /**
   * openComponentContextMenu - Opens a component context menu
   *
   * @param {Object} selection
   */
  openComponentContextMenu(selection, event) {
    // get iframe position
    this.sendMessage({
      type: 'openComponentContextMenu',
      selection,
      eventX: event.clientX,
      eventY: event.clientY,
    });
  }

  // TODO getInitialHistoryState() {
  //   const state = store.getState();
  //   const canvasTab = this.canvasId && getTabFromId(this.canvasId, state);
  //   const tabData = getTabData(canvasTab);
  //   let historyState = {
  //     initialEntries: ['/'],
  //     initialIndex: 0,
  //   };

  //   if (tabData && tabData.historyState) {
  //     historyState = tabData.historyState;
  //   }

  //   return historyState;
  // }

  setHistory({ history }) {
    this.history = Object.assign(this.history, history);

    if (this.canvasId) {
      this.unlistenHistory = history.listen(this.persistHistory);
    }
  }

  /**
   * updateComponentOutboundProps - Update builder component inbound props
   *
   * @param {Object} selection
   * @param {String} area
   * @param {Object} outboundProps
   */
  updateComponentOutboundProps(selection, area, outboundProps) {
    this.sendMessage({
      type: 'updateComponentOutboundProps',
      selection,
      area,
      outboundProps,
    });
  }

  /**
   * updateComponentInboundProps - Update builder component inbound props
   *
   * @param {Object} selection
   * @param {Object} inboundProps
   */
  updateComponentInboundProps(selection, inboundProps) {
    this.sendMessage({
      type: 'updateComponentInboundProps',
      selection,
      inboundProps,
    });
  }

  /**
   * updateComponentState - Update builder component state
   *
   * @param {Object} selection
   * @param {Object} state
   */
  updateComponentState(selection, state) {
    this.sendMessage({ type: 'updateComponentState', selection, state });
  }

  /**
   * updateComponentRect - Update builder component rect layout dimensions
   *
   * @param {Object} selection
   * @param {Object} rect
   */
  updateComponentRect(selection, rect) {
    this.sendMessage({ type: 'updateComponentRect', selection, rect });
  }

  /**
   * setComponentState - Sets an existing component state by selection
   *
   * @param {Object} selection
   * @param {Object} state
   */
  setComponentState(selection, state) {
    const bridgeComponent = this.findComponentBySelection(selection);

    if (bridgeComponent) {
      bridgeComponent.setComponentState(state);
    }
  }

  setCanvasError(err) {
    this.sendMessage({
      type: 'setCanvasError',
      err,
    });

    if (err) {
      console.error(err); // eslint-disable-line no-console
    }
  }
}

export default new ShiftBridge();
