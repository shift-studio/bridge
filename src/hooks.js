/* eslint-disable no-underscore-dangle */
import { useEffect, useCallback } from 'react';

let instanceCounter = 0;

function combineRs(rs, reportId) {
  return [...(rs || []), reportId];
}

class DebugKey {
  constructor(id, rootInstances, ownerScopeId, reports) {
    this.id = id;
    this.rootInstances = rootInstances;
    this.reports = reports;
    this.ownerScopeId = ownerScopeId;
  }

  toString() {
    return '';
  }
}

let inspector;

if (typeof window !== 'undefined' && window.__CLUTCH_INSPECTOR__) {
  inspector = window.__CLUTCH_INSPECTOR__;
}

// eslint-disable-next-line import/prefer-default-export
export const useReport = (props) => {
  let ownerScopeId;
  let reportsCounter = 0;
  const ownerDebugKey = props?.['data-d'];
  const ownerRootInstances = ownerDebugKey?.rootInstances
    ? [...ownerDebugKey.rootInstances, ownerDebugKey.id]
    : [];

  useEffect(() => {
    ownerScopeId = instanceCounter;
    instanceCounter += 1;

    return () => {
      if (inspector) {
        inspector.dropReports(ownerScopeId);
      }
    };
  }, []);

  const report = useCallback(
    (rs, instanceId, propName, attributes, variables) => {
      if (inspector) {
        const reportId = reportsCounter;
        reportsCounter += 1;

        inspector.report(
          ownerScopeId,
          reportId,
          instanceId,
          propName,
          attributes,
          variables,
        );

        return combineRs(rs, reportId);
      }

      return null;
    },
    [],
  );

  const getDebugKey = useCallback(
    (rs, instanceId) =>
      new DebugKey(instanceId, ownerRootInstances, ownerScopeId, rs),
    [],
  );

  return [report, getDebugKey];
};
