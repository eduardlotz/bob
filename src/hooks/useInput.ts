import { ChangeEvent, useState } from "react";

export const useInput = <T>(initalValue: string) => {
  const [value, setValue_] = useState(initalValue);
  const [error, setError] = useState<string>();

  const hasChanged = () => value !== initalValue;

  const setValue = (newValue: ChangeEvent<HTMLInputElement>) => {
    setError(undefined);
    setValue_(newValue.target.value);
  };

  return { value, setValue, error, setError, hasChanged };
};
