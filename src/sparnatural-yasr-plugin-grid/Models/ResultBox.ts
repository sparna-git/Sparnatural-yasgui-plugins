import { Propertie } from "./Propertie";

export class ResultBox {
  docIcon: string;
  docType: string;
  docTitle: string;
  docTitleURI: string;
  docImageURI?: string;
  predicates: Propertie[];
  static docTitle: string;

  constructor(
    icon: string,
    documentType: string,
    title: string,
    titleURI: string,
    imageURI: string,
    predicates: Propertie[]
  ) {
    this.docIcon = icon;
    this.docType = documentType;
    this.docTitle = title;
    this.docTitleURI = titleURI;
    this.docImageURI = imageURI;
    this.predicates = predicates;
  }

  addPredicate(predicate: Propertie) {
    this.predicates.push(predicate);
  }
}
