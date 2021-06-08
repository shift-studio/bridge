/* eslint-disable no-underscore-dangle */
import { useRef, useEffect, useCallback } from 'react';

let instanceCounter = 1;

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
  const ownerScopeIdRef = useRef(null);
  let reportsCounter = 0;
  const ownerDebugKey = props?.['data-d'];
  const ownerRootInstances = ownerDebugKey?.rootInstances
    ? [...ownerDebugKey.rootInstances, ownerDebugKey.id]
    : [];

  if (!ownerScopeIdRef.current) {
    ownerScopeIdRef.current = instanceCounter;
    instanceCounter += 1;
  }

  useEffect(() => {
    if (inspector && inspector.cancelDropReports && ownerScopeIdRef.current) {
      inspector.cancelDropReports(ownerScopeIdRef.current);
    }

    return () => {
      if (inspector && ownerScopeIdRef.current) {
        inspector.dropReports(ownerScopeIdRef.current);
      }
    };
  }, []);

  const report = useCallback(
    (rs, instanceId, propName, attributes, variables) => {
      if (inspector) {
        const reportId = reportsCounter;
        reportsCounter += 1;

        // remove data-d from attributes
        let reportAttributes = attributes;

        if (
          rs === null &&
          attributes &&
          typeof attributes === 'object' &&
          !Array.isArray(attributes) &&
          attributes !== null
        ) {
          reportAttributes = { ...attributes };
          delete reportAttributes['data-d'];
        }

        inspector.report(
          ownerScopeIdRef.current,
          reportId,
          instanceId,
          propName,
          reportAttributes,
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
      new DebugKey(instanceId, ownerRootInstances, ownerScopeIdRef.current, rs),
    [],
  );

  return [report, getDebugKey];
};
