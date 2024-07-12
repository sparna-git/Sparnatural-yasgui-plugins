export class I18n {
  static i18nLabelsResources: any = {
    en: require("./lang/en.json"),
    fr: require("./lang/fr.json"),
  };

  public static labels: any;

  private constructor() {}

  static init(lang: any) {
    I18n.labels = I18n.i18nLabelsResources[lang];
  }
}
