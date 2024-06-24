import { PropertyValue } from "./PropertyValue";
import { ValueType } from "./ValueType";

export class Property {
  label: string; // Label of the property or predicate, e.g., expose or author
  values: PropertyValue[]; // List of values of the property
  valueType: ValueType; // Type of the property or predicate, e.g., country or person
  uri: string; // URI of the label of the property

  constructor(
    label: string,
    values: PropertyValue[],
    valueType: ValueType,
    uri: string
  ) {
    this.label = label;
    this.values = values;
    this.valueType = valueType;
    this.uri = uri;
  }

  addValue(value: PropertyValue) {
    this.values.push(value);
  }
}
