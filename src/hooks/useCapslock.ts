import { useState, useCallback } from 'react';

export const useCapslock = (initialValue: string = '') => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue.toUpperCase());
  }, []);

  const setValueDirect = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  return {
    value,
    onChange: handleChange,
    setValue: setValueDirect
  };
};
