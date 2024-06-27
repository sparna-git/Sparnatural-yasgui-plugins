import { Property } from "./Property";

let propertyValueCounter = 1;

export class PropertyValue {
  id: number;
  label?: string; // Label of the value or information
  uri: string; // URI of the value or information
  predicates: Property[]; // If there are properties that have children properties or predicates

  constructor(label: string, uri: string, predicates: Property[]) {
    this.id = propertyValueCounter++;
    this.label = label;
    this.uri = uri;
    this.predicates = predicates;
  }

  addPredicate(predicate: Property) {
    this.predicates.push(predicate);
  }
}
