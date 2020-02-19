import areSelectionsEqual from './helpers/are-selections-equal';

export default class ClutchBridgeComponent {
  constructor(clutchBridge, selection, parentSelection, masterProps) {
    this.selection = selection;
    this.clutchBridge = clutchBridge;
    this.masterProps = masterProps;
    this.outboundProps = null;
    this.inboundProps = {};
    this.parentSelection = parentSelection;
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
