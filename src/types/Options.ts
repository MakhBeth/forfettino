export interface Options {
  locale: 'it' | 'de' | 'en' | 'es';
  footer: boolean;
  colors: {
    primary: string;
  };
  headingImage?: string;
  createdBy: {
    text: string;
    link: string;
  };
}
