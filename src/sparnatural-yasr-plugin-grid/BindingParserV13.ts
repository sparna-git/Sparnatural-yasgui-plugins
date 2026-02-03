import Parser from "../parsers";
import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
import { ValueType } from "./Models/ValueType";
import { PropertyValue } from "./Models/PropertyValue";
import { ResultBoxType } from "./Models/ResultBoxType";

import { SparnaturalQuery } from "../SparnaturalQueryIfc-v13";
// Adjust this import path to your project if needed
import { PredicateObjectPair } from "../../../Sparnatural/dist/types/sparnatural/SparnaturalQueryIfc-v13";

const im = require("./image-defaults/imageNone.jpg");

export class BindingParserV13 {
  constructor() {}

  // ---------------------------
  // Helpers (unchanged logic)
  // ---------------------------

  // Verify if an URI is an image URI
  private isImageURI(uri: string | undefined): boolean {
    if (!uri) return false;
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }

  // Check if a column has image URIs in the first N bindings
  private columnHasImageValues(
    column: string,
    bindings: Parser.Binding[],
  ): boolean {
    for (const bindingSet of bindings.slice(0, 10)) {
      const value = (bindingSet as any)[column];
      if (value && value.type === "uri" && this.isImageURI(value.value)) {
        return true;
      }
    }
    return false;
  }

  // Read a variable value from a list of binding sets
  private getValueFromBindings(bindingSet: Parser.Binding[], variable: string) {
    for (const values of bindingSet) {
      if (Object.prototype.hasOwnProperty.call(values, variable)) {
        return (values as any)[variable];
      }
    }
    return undefined;
  }

  // Retrieve predicate label using configuration (unchanged behavior)
  private getLabelpre(predicateURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      const objectType = queryConfiguration.getProperty(predicateURI);
      if (objectType) return objectType.getLabel() || predicateURI;
      return predicateURI;
    }
    return predicateURI;
  }

  // Retrieve entity label using configuration (unchanged behavior)
  private getEntityLabel(entityURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      const object = queryConfiguration.getEntity(entityURI);
      if (object) return object.getLabel() || entityURI;
      return entityURI;
    }
    return entityURI;
  }

  // ---------------------------
  // v13-native query reading
  // ---------------------------

  // Main title column = subject variable of bgpSameSubject
  private identifyMainTitleColumn(query: SparnaturalQuery): string | undefined {
    if (!query?.variables || query.variables.length === 0) {
      console.error("Aucune variable trouvée dans la requête.");
      return undefined;
    }
    if (!query?.where) {
      console.error("Aucune structure where trouvée dans la requête.");
      return undefined;
    }
    if (!query.where.subject?.value) {
      console.error("Aucun sujet trouvé dans la requête.");
      return undefined;
    }

    console.log("Main title column:", query.where.subject.value);
    return query.where.subject.value;
  }

  // Extract main title and URI from a binding set (unchanged behavior)
  private extractMainTitleAndURI(
    bindingSet: Parser.Binding,
    principalColumnTitle: any,
  ): { title: string; uri: string } {
    let mainTitle = "";
    let mainURI = "";

    if (
      principalColumnTitle &&
      (bindingSet as Parser.Binding)[principalColumnTitle]
    ) {
      const value = (bindingSet as Parser.Binding)[principalColumnTitle];
      mainTitle = (value.label ? value.label : value.value) ?? "";
      mainURI = value.value ?? "";
    }

    return { title: mainTitle, uri: mainURI };
  }

  // Identifie la colonne image principale uniquement au 1er niveau du sujet
  private identifyPrincipalImageColumn(
    query: SparnaturalQuery,
    bindings: Parser.Binding[],
  ): string | undefined {
    const pairs = query.where?.predicateObjectPairs ?? [];

    for (const pair of pairs) {
      // On ne considère que les objets simples (pas de relations imbriquées)
      if (
        pair.object?.variable &&
        !pair.object.predicateObjectPairs &&
        this.columnHasImageValues(pair.object.variable.value, bindings)
      ) {
        return pair.object.variable.value;
      }
    }

    return undefined;
  }

  // Extract main image URI from a binding set (unchanged behavior)
  private extractMainImageURI(
    bindingSet: Parser.Binding,
    principalColumnImage: any,
  ): string | undefined {
    if (principalColumnImage && bindingSet) {
      if ((bindingSet as Parser.Binding)[principalColumnImage]) {
        const value = (bindingSet as Parser.Binding)[principalColumnImage];
        return value.value;
      }
      return im;
    }
    return undefined;
  }

  // Build map: variable -> predicate label (same semantics as before)
  private getPredicate(
    query: SparnaturalQuery,
    queryConfiguration: any,
  ): Record<string, string> {
    const predicates: Record<string, string> = {};

    const visit = (pairs: PredicateObjectPair[]) => {
      for (const pair of pairs) {
        const o = pair.object.variable.value;
        const p = pair.predicate.value;
        predicates[o] = this.getLabelpre(p, queryConfiguration);

        if (
          pair.object.predicateObjectPairs &&
          pair.object.predicateObjectPairs.length > 0
        ) {
          visit(pair.object.predicateObjectPairs);
        }
      }
    };

    visit(query.where.predicateObjectPairs);

    // Keep same behavior: ensure subject exists with empty label
    const s = query.where.subject.value;
    if (!(s in predicates)) predicates[s] = "";

    return predicates;
  }

  // Build map: variable -> predicate URI
  private getPredicateURI(query: SparnaturalQuery): Record<string, string> {
    const predicates: Record<string, string> = {};

    const visit = (pairs: PredicateObjectPair[]) => {
      for (const pair of pairs) {
        const o = pair.object.variable.value;
        predicates[o] = pair.predicate.value;

        if (
          pair.object.predicateObjectPairs &&
          pair.object.predicateObjectPairs.length > 0
        ) {
          visit(pair.object.predicateObjectPairs);
        }
      }
    };

    visit(query.where.predicateObjectPairs);

    // Keep same behavior: ensure subject exists with empty value
    const s = query.where.subject.value;
    if (!(s in predicates)) predicates[s] = "";

    return predicates;
  }

  // Build map: variable -> object type label (same semantics as before)
  private getObject(
    query: SparnaturalQuery,
    queryConfiguration: any,
  ): Record<string, string> {
    const objects: Record<string, string> = {};

    const visit = (pairs: PredicateObjectPair[]) => {
      for (const pair of pairs) {
        const o = pair.object.variable.value;
        const oType = pair.object.variable.rdfType;

        if (query.variables.find((v: any) => v.value === o)) {
          objects[o] = this.getEntityLabel(oType, queryConfiguration);
        }

        if (
          pair.object.predicateObjectPairs &&
          pair.object.predicateObjectPairs.length > 0
        ) {
          visit(pair.object.predicateObjectPairs);
        }
      }
    };

    visit(query.where.predicateObjectPairs);

    // Add subject (same idea as before)
    const s = query.where.subject.value;
    const sType = query.where.subject.rdfType;
    objects[s] = this.getEntityLabel(sType, queryConfiguration);

    return objects;
  }

  // Build map: variable -> object type URI
  private getObjectUri(query: SparnaturalQuery): Record<string, string> {
    const objects: Record<string, string> = {};

    const visit = (pairs: PredicateObjectPair[]) => {
      for (const pair of pairs) {
        const o = pair.object.variable.value;
        const oType = pair.object.variable.rdfType;

        if (query.variables.find((v: any) => v.value === o)) {
          objects[o] = oType;
        }

        if (
          pair.object.predicateObjectPairs &&
          pair.object.predicateObjectPairs.length > 0
        ) {
          visit(pair.object.predicateObjectPairs);
        }
      }
    };

    visit(query.where.predicateObjectPairs);

    objects[query.where.subject.value] = query.where.subject.rdfType;

    return objects;
  }

  // ---------------------------
  // Properties reading (v13-native, same detailed logic)
  // ---------------------------

  public readProperties(
    query: SparnaturalQuery,
    queryConfig: any,
    bindingSet: Parser.Binding[],
    predicates: Record<string, string>,
    objects: Record<string, string>,
  ): Property[] {
    const propertiesList: Property[] = [];

    for (const pair of query.where.predicateObjectPairs) {
      const properties = this.readPropertyForPair(
        pair,
        bindingSet,
        query,
        queryConfig,
        predicates,
        objects,
      );
      propertiesList.push(...properties);
    }

    const variableOrder = query.variables.map((v: any) => v.value);
    return this.ordredpropertiesListfun(variableOrder, propertiesList);
  }

  // Sort properties based on variable order (unchanged logic)
  private ordredpropertiesListfun(
    variableOrder: any,
    propertiesList: Property[],
  ): Property[] {
    // Séparer les propriétés en deux listes : celles qui sont dans variableOrder et celles qui ne le sont pas
    const inOrderProperties: Property[] = [];
    const outOfOrderProperties: Property[] = [];

    //scinder les propriétés en deux listes celles qui sont presentes dans variableOrder et celles qui ne le sont pas
    for (const property of propertiesList) {
      if (variableOrder.includes(property.column)) {
        inOrderProperties.push(property);
      } else {
        outOfOrderProperties.push(property);
      }
    }

    // Trier les propriétés qui sont dans variableOrder
    const sortedInOrderProperties = inOrderProperties.sort((a, b) => {
      const aIndex = variableOrder.indexOf(a.column);
      const bIndex = variableOrder.indexOf(b.column);
      return aIndex - bIndex;
    });

    // Trier récursivement les fils de chaque propriété
    for (const property of sortedInOrderProperties) {
      for (const value of property.values) {
        if (value.predicates.length > 0) {
          value.predicates = this.ordredpropertiesListfun(
            variableOrder,
            value.predicates,
          );
        }
      }
    }

    // Trier récursivement les fils des propriétés hors ordre
    for (const property of outOfOrderProperties) {
      for (const value of property.values) {
        if (value.predicates.length > 0) {
          value.predicates = this.ordredpropertiesListfun(
            variableOrder,
            value.predicates,
          );
        }
      }
    }

    return [...sortedInOrderProperties, ...outOfOrderProperties];
  }

  // v13-native equivalent of old readPropertyForLine, but reads from a PredicateObjectPair
  private readPropertyForPair(
    pair: PredicateObjectPair,
    bindingSet: Parser.Binding[],
    query: SparnaturalQuery,
    queryConfig: any,
    predicates: Record<string, string>,
    objects: Record<string, string>,
  ): Property[] {
    const propertiesList: Property[] = [];

    const rootVariable = query.where.subject.value;
    const objectVariable = pair.object.variable.value;
    const value = this.getValueFromBindings(bindingSet, objectVariable);

    // Keep same semantics, but avoid recomputing inside recursion too often could be optimized later
    const predicatesURI = this.getPredicateURI(query);
    const objectU = this.getObjectUri(query);

    const valuesArray: PropertyValue[] = [];

    // Same detailed value handling
    if (
      value !== undefined &&
      value?.label !== undefined &&
      value?.type === "x-labelled-uri"
    ) {
      valuesArray.push(new PropertyValue(value.label ?? "", value.value, []));
    }

    if (
      value?.value !== undefined &&
      value?.label === undefined &&
      value?.type === "literal"
    ) {
      valuesArray.push(new PropertyValue(value.value ?? "", "", []));
    }

    if (
      value?.type === "uri" &&
      value?.value !== undefined &&
      !this.isImageURI(value.value)
    ) {
      valuesArray.push(new PropertyValue(value.value, value.value, []));
    }

    // Skip image properties exactly as before
    if (this.isImageURI(value?.value)) {
      return [];
    }

    let predicate = new Property(
      predicates[objectVariable] ?? "",
      valuesArray,
      new ValueType(objectU[objectVariable], objects[objectVariable]),
      predicatesURI[objectVariable] ?? "",
      rootVariable,
    );

    // Children recursion: predicateObjectPairs becomes the old children
    if (
      pair.object.predicateObjectPairs &&
      pair.object.predicateObjectPairs.length > 0
    ) {
      const childrenProperties = pair.object.predicateObjectPairs.flatMap(
        (child) =>
          this.readPropertyForPair(
            child,
            bindingSet,
            query,
            queryConfig,
            predicates,
            objects,
          ),
      );

      if (value === undefined) {
        const valueWithChildren = new PropertyValue("", "", []);
        for (const childProp of childrenProperties) {
          valueWithChildren.addPredicate(childProp);
        }
        predicate.addValue(valueWithChildren);
      } else {
        for (const val of predicate.values) {
          for (const childProp of childrenProperties) {
            val.addPredicate(childProp);
          }
        }
      }
    }

    propertiesList.push(predicate);
    return propertiesList;
  }

  // Méthode qui fusionne les propriétés appartenant au même objet principal
  private mergeProperties(existingProperty: Property, newProperty: Property) {
    for (const newValue of newProperty.values) {
      // CAS 1 — valeur SANS identité → bucket unique
      if (!newValue.label && !newValue.uri) {
        // On cherche s'il existe déjà une valeur "vide"
        let existingValue = existingProperty.values.find(
          (v) => !v.label && !v.uri,
        );

        // Si elle n'existe pas encore, on la crée
        if (!existingValue) {
          existingValue = newValue;
          existingProperty.values.push(existingValue);
          continue;
        }

        // Merge récursif des prédicats
        for (const predicate of newValue.predicates) {
          const existingPredicate = existingValue.predicates.find(
            (p) => p.uri === predicate.uri,
          );

          if (existingPredicate) {
            this.mergeProperties(existingPredicate, predicate);
          } else {
            existingValue.predicates.push(predicate);
          }
        }

        continue;
      }

      // CAS 2 — valeur AVEC identité → merge classique
      const existingValue = existingProperty.values.find(
        (value) =>
          (value.label && newValue.label && value.label === newValue.label) ||
          (value.uri && newValue.uri && value.uri === newValue.uri),
      );

      if (existingValue) {
        for (const predicate of newValue.predicates) {
          const existingPredicate = existingValue.predicates.find(
            (p) => p.uri === predicate.uri,
          );

          if (existingPredicate) {
            this.mergeProperties(existingPredicate, predicate);
          } else {
            existingValue.predicates.push(predicate);
          }
        }
      } else {
        existingProperty.values.push(newValue);
      }
    }
  }

  // ---------------------------
  // Document type helpers (v13-native)
  // ---------------------------

  public extractDocumentTypeURIFromQuery(
    query: SparnaturalQuery,
  ): string | undefined {
    return query?.where?.subject?.rdfType;
  }

  public getDocumentTypeLabel(
    documentTypeURI: string,
    queryConfiguration: any,
  ): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getEntity === "function"
    ) {
      const entity = queryConfiguration.getEntity(documentTypeURI);
      if (entity) return entity.getLabel() || documentTypeURI;
      return documentTypeURI;
    }
    return documentTypeURI;
  }

  public getDocumentTypeIconClass(
    documentTypeURI: string,
    queryConfiguration: any,
  ): string | undefined {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getEntity === "function"
    ) {
      const entity = queryConfiguration.getEntity(documentTypeURI);
      if (entity) return entity.getIcon() || undefined;
      return undefined;
    }
    return undefined;
  }

  //this methode will use all the previous methode to extract the result data and return our data structure ResultBoxM[]
  public extractResultData(
    bindings: Parser.Binding[],
    query: SparnaturalQuery,
    queryConfig: any,
  ): ResultBoxM[] {
    const resultBoxes: ResultBoxM[] = [];

    if (!query && !queryConfig) {
      console.error("No query found");
      return [];
    }

    const documentTypeURI = this.extractDocumentTypeURIFromQuery(query);

    const documentTypeLabel = documentTypeURI
      ? this.getDocumentTypeLabel(documentTypeURI, queryConfig)
      : "";

    const documentTypeIcon = this.getDocumentTypeIconClass(
      documentTypeURI ?? "",
      queryConfig,
    );

    const type = new ResultBoxType(
      documentTypeURI ?? "",
      documentTypeLabel,
      documentTypeIcon ?? "",
    );

    const principalColumnTitle = this.identifyMainTitleColumn(query);
    const principalColumnImage = this.identifyPrincipalImageColumn(
      query,
      bindings,
    );

    const predicatesColumnLabel = this.getPredicate(query, queryConfig);
    const objectsColumnLabel = this.getObject(query, queryConfig);

    const titleMap: Record<string, ResultBoxM> = {};

    for (const bindingSet of bindings) {
      const { title, uri } = this.extractMainTitleAndURI(
        bindingSet,
        principalColumnTitle,
      );

      const predicates: Property[] = this.readProperties(
        query,
        queryConfig,
        [bindingSet],
        predicatesColumnLabel,
        objectsColumnLabel,
      );

      const imageURI = this.extractMainImageURI(
        bindingSet,
        principalColumnImage,
      );

      // Merge by URI (same behavior)
      if (uri in titleMap && title !== "") {
        const existingBox = titleMap[uri];

        for (const predicate of predicates) {
          const existingPredicate = existingBox.predicates.find(
            (p) => p.uri === predicate.uri,
          );
          if (existingPredicate) {
            this.mergeProperties(existingPredicate, predicate);
          } else {
            existingBox.predicates.push(predicate);
          }
        }

        if (imageURI && !existingBox.image) {
          existingBox.image = imageURI;
        }
      } else {
        if (title !== "") {
          const resultBox = new ResultBoxM(
            type,
            title,
            uri,
            imageURI ?? "",
            predicates,
          );
          titleMap[uri] = resultBox;
        }
      }
    }

    for (const uri in titleMap) {
      resultBoxes.push(titleMap[uri]);
    }

    console.log("Result boxes", resultBoxes);
    return resultBoxes;
  }
}
