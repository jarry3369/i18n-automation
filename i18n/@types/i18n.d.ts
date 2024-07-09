import { resources } from '../resource';

declare module 'i18next' {
  interface CustomTypeOptions {
    allowObjectInHTMLChildren: true;
    resources: typeof resources;
  }
}
