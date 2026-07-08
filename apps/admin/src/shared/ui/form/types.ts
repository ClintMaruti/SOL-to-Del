/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type AnyFormApi = {
  Field: React.ComponentType<any>;
  state: any;
  store: any;
  getFieldValue: (...args: any[]) => any;
  getFieldMeta: (...args: any[]) => any;
  setFieldMeta: (...args: any[]) => void;
  setFieldValue: (...args: any[]) => void;
  pushFieldValue: Function;
  insertFieldValue: Function;
  removeFieldValue: Function;
  validateAllFields: (...args: any[]) => any;
  handleSubmit: (...args: any[]) => any;
  reset: (...args: any[]) => void;
};
/* eslint-enable @typescript-eslint/no-unsafe-function-type */
/* eslint-enable @typescript-eslint/no-explicit-any */
