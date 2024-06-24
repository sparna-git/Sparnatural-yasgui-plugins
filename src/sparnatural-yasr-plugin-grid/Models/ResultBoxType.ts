export class ResultBoxType {
  uri: string; //uri of the type exemple http://exemple.fr/country
  label: string; //label of the type exemple Country or Person
  icon: string; //icon of the type exemple musuem or person

  constructor(uri: string, label: string, icon: string) {
    this.uri = uri;
    this.label = label;
    this.icon = icon;
  }
}
