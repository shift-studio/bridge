export default () => {
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
