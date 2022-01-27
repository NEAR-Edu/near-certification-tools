/* eslint-disable import/prefer-default-export */
export function getSimpleStringFromParam(paramValue: string | string[]) {
  return typeof paramValue === 'string' ? paramValue : paramValue[0];
}
