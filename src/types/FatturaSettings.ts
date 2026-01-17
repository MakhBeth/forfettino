export interface FatturaSettings {
  id: string;
  primaryColor: string;
  headingImage?: string; // base64, optional
  footerEnabled: boolean;
  createdByText: string;
  createdByLink: string;
  defaultLocale: 'it' | 'de' | 'en' | 'es';
}

export const DEFAULT_FATTURA_SETTINGS: FatturaSettings = {
  id: 'main',
  primaryColor: '#6699cc',
  headingImage: undefined,
  footerEnabled: true,
  createdByText: 'Davide Di Pumpo',
  createdByLink: 'mailto:davide.dipumpo@gmail.com',
  defaultLocale: 'it'
};
