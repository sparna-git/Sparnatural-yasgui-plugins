export class ValueType {
  uri: string; //uri of the type exemple http://exemple.fr/country
  label: string; //label of the type exemple Country or Person

  constructor(uri: string, label: string) {
    this.uri = uri;
    this.label = label;
  }
}
