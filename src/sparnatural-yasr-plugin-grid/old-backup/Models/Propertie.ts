export class Propertie {
  predicateAttribute?: string;
  value?: string; //[] liste de string (value)
  uriValue?: string; // [] liste de string (URI)
  typeObject?: string;
  children: Propertie[];

  constructor(
    predicateAttribute: string,
    value: string,
    uriValue: string,
    typeObject: string,
    children: Propertie[] = []
  ) {
    this.predicateAttribute = predicateAttribute;
    this.value = value;
    this.uriValue = uriValue;
    this.typeObject = typeObject;
    this.children = children;
  }

  addChild(child: Propertie) {
    this.children.push(child);
  }
}
