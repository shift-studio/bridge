import find from 'lodash/find';
import areSelectionsEqual from './helpers/are-selections-equal';
import getSelectionUID from './helpers/get-selection-uid';
import shallowEqual from './helpers/shallow-equal';

export default class ShiftBridgeComponent {
  constructor(
    shiftBridge,
    selection,
    parentSelection,
    masterProps,
    updateComponentCallback,
    setState,
  ) {
    this.selection = selection;
    this.shiftBridge = shiftBridge;
    this.updateComponent = updateComponentCallback;
    this.setState = setState;
    this.reference = undefined;
    this.childReferences = [];
    this.masterProps = masterProps;
    this.outboundProps = null;
    this.inboundProps = {};
    this.state = undefined;
    this.parentSelection = parentSelection;
  }

  setReference(reference) {
    this.reference = reference;

    if (this.parentSelection) {
      this.shiftBridge.registerComponentChildReference(
        this.parentSelection,
        this.selection,
        this.reference,
      );
    }

    // attach builder events
    reference.addEventListener('mouseover', this.onMouseOver);
    reference.addEventListener('mouseout', this.onMouseOut);
    reference.addEventListener('click', this.onClick);
    reference.addEventListener('doubleclick', this.onDoubleClick);
    reference.addEventListener('contextmenu', this.onContextMenu);
  }

  setChildReference(childSelection, reference) {
    if (!this.reference) {
      const uuid = getSelectionUID(childSelection);
      const refObj = find(this.childReferences, (r) => r.id === uuid);

      if (refObj) {
        refObj.reference = reference;
      } else {
        this.childReferences.push({
          id: uuid,
          reference,
        });
      }

      if (this.parentSelection) {
        this.shiftBridge.registerComponentChildReference(
          this.parentSelection,
          childSelection,
          reference,
        );
      }
    }
  }

  // mouse over when editing
  onMouseOver = (event) => {
    if (this.shiftBridge.editing) {
      event.stopPropagation();

      this.shiftBridge.overComponent(this.selection);
    }
  };

  // mouse out when editing
  onMouseOut = () => {
    if (this.shiftBridge.editing) {
      this.shiftBridge.outComponent(this.selection);
    }
  };

  // open context menu (when editing only)
  onContextMenu = (event) => {
    if (this.shiftBridge.editing) {
      event.stopPropagation();
      event.preventDefault();

      this.shiftBridge.openComponentContextMenu(this.selection, event);
    }
  };

  // select component (when editing only)
  onClick = (event) => {
    if (this.shiftBridge.editing) {
      event.stopPropagation();
      event.preventDefault();

      this.shiftBridge.selectComponent(this.selection);
    }
  };

  // unlock component (when editing only)
  onDoubleClick = () => {
    if (this.shiftBridge.editing) {
      this.shiftBridge.unlockComponent(this.selection);
    }
  };

  getElementRect(element) {
    let result = {};

    try {
      const rect = element.getBoundingClientRect();
      result = {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    } catch (e) {
      //
    }

    return result;
  }

  getElementBoxLayout(element) {
    let result = {};

    try {
      result = {
        paddingLeft: element.getStyle('padding-left'),
        paddingRight: element.getStyle('padding-right'),
        paddingTop: element.getStyle('padding-top'),
        paddingBottom: element.getStyle('padding-bottom'),
        marginLeft: element.getStyle('margin-left'),
        marginRight: element.getStyle('margin-right'),
        marginTop: element.getStyle('margin-top'),
        marginBottom: element.getStyle('margin-bottom'),
      };
    } catch (e) {
      //
    }

    return result;
  }

  updateRect() {
    let calculatedRect = {};

    if (this.reference) {
      calculatedRect = {
        ...this.getElementRect(this.reference),
        ...this.getElementBoxLayout(this.reference),
      };
    } else {
      const childElements = this.childReferences;

      childElements.forEach((childElement, index) => {
        const childElementRect = this.getElementRect(childElement.reference);

        if (index === 0) {
          calculatedRect = childElementRect;
        } else {
          calculatedRect.top = Math.min(
            childElementRect.top,
            calculatedRect.top,
          );
          calculatedRect.bottom = Math.max(
            childElementRect.bottom,
            calculatedRect.bottom,
          );
          calculatedRect.left = Math.min(
            childElementRect.left,
            calculatedRect.left,
          );
          calculatedRect.right = Math.max(
            childElementRect.right,
            calculatedRect.right,
          );

          calculatedRect.width = calculatedRect.right - calculatedRect.left;
          calculatedRect.height = calculatedRect.bottom - calculatedRect.top;
        }
      });
    }

    if (!shallowEqual(this.calculatedRect, calculatedRect)) {
      this.calculatedRect = calculatedRect;
      this.shiftBridge.updateComponentRect(this.selection, calculatedRect);
    }
  }

  updateOutboundProps(propName, flowProps) {
    this.outboundProps = this.outboundProps || {};
    this.outboundProps[propName] = flowProps;
  }

  updateInboundProps(flowProps) {
    this.inboundProps = flowProps;
  }

  updateMasterProps(masterProps) {
    this.masterProps = masterProps;
  }

  updateState(state) {
    this.state = state;
  }

  setComponentState(state) {
    // udpate component state directly
    // internal this.state will be udpated afterwards
    this.setState(state);
  }

  /**
   * matchesSelection - Checks if a given selection matches this component selection
   *
   * @param {Object} selection
   * @param {Boolean} noKeys if it should ignore keys
   *
   * @returns {Boolean} true if matches
   */
  matchesSelection(selection, noKeys = false) {
    return areSelectionsEqual(selection, this.selection, noKeys);
  }
}
