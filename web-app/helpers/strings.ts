/* eslint-disable import/prefer-default-export */
export function getSimpleStringFromParam(paramValue: string | string[] | undefined) {
  if (paramValue) {
    return typeof paramValue === 'string' ? paramValue : paramValue[0];
  } else {
    return '';
  }
}
