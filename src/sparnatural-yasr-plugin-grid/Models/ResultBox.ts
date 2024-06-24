import { ResultBoxType } from "./ResultBoxType";
import { Property } from "./Property";
export class ResultBoxM {
  typeResultBox: ResultBoxType; //type of the box exemple museum or person
  title: string; //main title of the box
  uri: string; //uri of the box using on the consult button
  image?: string; //image if will be choosen in the query
  predicates: Property[]; //liste of the properties of the box

  constructor(
    typeResultBox: ResultBoxType,
    title: string,
    uri: string,
    image: string,
    predicates: Property[]
  ) {
    this.typeResultBox = typeResultBox;
    this.title = title;
    this.uri = uri;
    this.image = image;
    this.predicates = predicates;
  }

  addPredicate(predicate: Property) {
    this.predicates.push(predicate);
  }
}
