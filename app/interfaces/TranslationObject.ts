export interface TranslationObject {
  id:       string;
  language: Language;
  key:      string;
  value:    string;
}

export enum Language {
  EnUS = "en-US",
  Es419 = "es-419",
}