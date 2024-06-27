import Parser from "../parsers";
import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
import { ValueType } from "./Models/ValueType";
import { PropertyValue } from "./Models/PropertyValue";
import { ResultBoxType } from "./Models/ResultBoxType";

import { Branch, ISparJson } from "../ISparJson";
import { faDiceFive } from "@fortawesome/free-solid-svg-icons";
import L from "leaflet";
const im = require("./image-defaults/imageNone.jpg");
export class BindingParser {
  constructor() {}

  //methode qui va permettre de recuperer la colonne qui contient le titre principal
  private identifyPrincipalTitleColumn(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    // Vérifier si la requête est disponible et si elle contient des variables
    //verify if the query is available and if it contains variables
    if (!query || !query.variables || query.variables.length === 0) {
      console.error("Aucune variable trouvée dans la requête.");
      return undefined;
    }

    // Parcourir toutes les variables de la requête
    //loop through all the variables in the query
    for (const variable of query.variables) {
      const variableName = variable.value;

      // Initialiser un compteur pour les résultats valides
      //initialize a counter for valid results
      let validCount = 0;

      // Calculer le nombre de paires à vérifier en fonction du nombre total de résultats
      //calculate the number of pairs to check based on the total number of results
      const totalResults = bindings.length;
      //ceil c'est pour arrondir à l'entier supérieur a voire !!!
      const pairsToCheck = Math.ceil(totalResults / 10);
      /*
      console.log("pairsToCheck", pairsToCheck);
      console.log("pairsToCheck * 2", pairsToCheck * 2);
      console.log("totalResults", totalResults);
      */
      // Vérifier les paires de résultats
      for (let i = 0; i < totalResults; i += 10) {
        const indicesToCheck = [i, i + 1];

        for (const index of indicesToCheck) {
          if (index < totalResults && bindings[index][variableName]) {
            const value = bindings[index][variableName];
            //la condition pour que la colonne soit valide c'est que les 10 premiers resultats doivent etre des x-labelled-uri
            //les 10 resultats se fait par un saut de 10 en 10 donc si on a 100 resulats on va verifier les resultats
            //0,1,10,11,20,21,30,31,40,41,50,51,60,61,70,71,80,81,90,91 cela nous permettra de voir une idéé sur la colonne
            //le test il peut etre amelioré
            if (value.type === "x-labelled-uri") {
              validCount++;
            } else {
              validCount = 0; // Reset the counter if any value is not "x-labelled-uri"
              break;
            }
          }
        }

        // If any of the 10 result pairs are invalid, continue to the next variable
        //pour chaque paire des resultats si un des resultats n'est pas un x-labelled-uri on arrete la boucle
        if (validCount < 2) {
          validCount = 0; // Reset the counter and break the inner loop
          break;
        }
      }

      // If we have found the required number of valid results, return the variable name
      if (validCount >= pairsToCheck * 2) {
        return variableName;
      }
    }
    // If no valid column is found, log an error and return undefined
    console.error(
      "Impossible de trouver une colonne de titre avec des informations de type x-labelled-uri."
    );
    return undefined;
  }

  //methode qui va permettre de recuperer le couple titre principal et l'uri
  private extractMainTitleAndURI(
    bindingSet: Parser.Binding,
    principalColumnTitle: any
  ): {
    title: string;
    uri: string;
  } {
    let mainTitle = "";
    let mainURI = "";
    //verifier si la colonne du titre principal existe
    if (principalColumnTitle && bindingSet[principalColumnTitle]) {
      const value = bindingSet[principalColumnTitle];
      mainTitle = value.label ?? "";
      mainURI = value.value ?? "";
    }
    return { title: mainTitle, uri: mainURI };
  }

  private identifyPrincipalImageColumn(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    if (query && query.branches && query.branches.length > 0) {
      // Parcourir chaque branche de premier niveau de la requête
      for (const branch of query.branches) {
        // Vérifier si la branche a un sujet (objet principal)
        if (branch.line && branch.line.s) {
          // Vérifier si la branche a une colonne "o" qui appartient directement à l'objet principal
          if (
            branch.line.o &&
            this.columnHasImageValues(branch.line.o, bindings)
          ) {
            return branch.line.o;
          }
        }
      }
    }
    return undefined;
  }

  // Méthode pour vérifier si une colonne a des valeurs qui sont des URI d'image
  private columnHasImageValues(
    column: string,
    bindings: Parser.Binding[]
  ): boolean {
    // Parcourir les bindings
    for (const bindingSet of bindings.slice(0, 10)) {
      const value = bindingSet[column];
      // Vérifier si la valeur est une URI d'image
      if (value && value.type === "uri" && this.isImageURI(value.value)) {
        return true;
      }
    }
    return false;
  }

  //----------------------------------------------------------------------------------------
  //OK
  //verifier si une uri est une uri d'image ou non RegularExpression
  private isImageURI(uri: string | undefined): boolean {
    if (!uri) {
      return false;
    }
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }

  // une fois trouver la colonne de l'image principale on va extraire l'uri de l'image sur le bindingset
  //partie lecture
  private extractMainImageURI(
    bindingSet: Parser.Binding,
    principalColumnImage: any
  ): string | undefined {
    let value = { value: "" };
    if (principalColumnImage && bindingSet) {
      if (bindingSet[principalColumnImage]) {
        value = bindingSet[principalColumnImage];
        return value.value;
      } else {
        return im;
      }
    }
    return undefined;
  }

  // Méthode pour récupérer le label des prédicats en utilisant les branches de la query
  private getPredicate(
    query: ISparJson,
    queryConfiguration: any
  ): Record<string, string> {
    // Initialiser un objet pour stocker les prédicats et les types d'objets
    const predicates: Record<string, string> = {};

    // Parcourir les branches de la query
    for (const branch of query.branches) {
      // Appeler la méthode searchInBranch pour chaque branche
      this.searchInBranch(branch, predicates, queryConfiguration, query);
    }

    return predicates;
  }

  // Méthode pour parcourir les branches et les enfants pour trouver les prédicats
  private searchInBranch(
    branch: any,
    predicates: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter le prédicat pour la propriété `o` de la branche
    //ajouter une condition pour verifier si le predicates[line.o] est present dans les variables de la query
    //si oui on recupere le label du prédicat
    //sinon vide
    if (line.o) {
      //recuperer le libelle du prédicat en utilisant la methode getLabelpre
      const predicateLabel = this.getLabelpre(line.p, queryConfiguration);
      predicates[line.o] = predicateLabel;
    }

    // Ajouter également le sujet si nécessaire
    if (!(line.s in predicates)) {
      predicates[line.s] = "";
    }

    // Parcourir les enfants de la branche recursivement
    for (const child of branch.children) {
      this.searchInBranch(child, predicates, queryConfiguration, query);
    }
  }

  // Méthode pour retourner le label du prédicat en prenant le prédicat comme paramètre
  private getLabelpre(predicateURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      // Récupérer le type de l'objet avec la méthode getProperty
      const objectType = queryConfiguration.getProperty(predicateURI);
      if (objectType) {
        return objectType.getLabel() || predicateURI;
      } else {
        return predicateURI;
      }
    } else {
      return predicateURI;
    }
  }

  // Méthode pour récupérer les prédicats URI en utilisant les branches de la query
  private getPredicateURI(
    query: ISparJson,
    queryConfiguration: any
  ): Record<string, string> {
    // Initialiser un objet pour stocker les prédicats et les types d'objets
    const predicates: Record<string, string> = {};

    // Parcourir les branches de la query
    for (const branch of query.branches) {
      this.searchInBranchURI(branch, predicates, queryConfiguration, query);
    }

    return predicates;
  }

  // Méthode pour parcourir les branches et les enfants pour trouver les prédicats URI
  private searchInBranchURI(
    branch: any,
    predicates: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter le prédicat pour la propriété `o` de la branche
    // Ajouter une condition pour vérifier si le predicates[line.o] est présent dans les variables de la query
    // Si oui, on récupère l'URI du prédicat
    if (
      query.variables.find((variable: any) => variable.value === line.o) ||
      line.o
    ) {
      predicates[line.o] = line.p;
    }

    // Ajouter également le sujet si nécessaire
    if (!(line.s in predicates)) {
      predicates[line.s] = "";
    }

    // Parcourir les enfants de la branche
    for (const child of branch.children) {
      this.searchInBranchURI(child, predicates, queryConfiguration, query);
    }
  }

  // Méthode pour récupérer le label des objets en utilisant les branches de la query
  private getObject(
    query: ISparJson,
    queryConfiguration: any
  ): Record<string, string> {
    // Initialiser un objet pour stocker les objets et leurs types
    const objects: Record<string, string> = {};

    // Parcourir les branches de la query
    for (const branch of query.branches) {
      this.searchObjectInBranch(branch, objects, queryConfiguration, query);
    }

    return objects;
  }

  // Méthode pour parcourir les branches et les enfants pour trouver les objets
  private searchObjectInBranch(
    branch: any,
    objects: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter l'objet pour la propriété `o` de la branche
    if (query.variables.find((variable: any) => variable.value === line.o)) {
      const objectTypeLabel = this.getObjectLabel(
        line.oType,
        queryConfiguration
      );
      objects[line.o] = objectTypeLabel;
    }
    // Ajouter également le sujet si nécessaire
    if (!(line.s in objects)) {
      const subjectTypeLabel = this.getObjectLabel(
        line.sType,
        queryConfiguration
      );
      objects[line.s] = subjectTypeLabel;
    }

    // Parcourir les enfants de la branche recursivement
    for (const child of branch.children) {
      this.searchObjectInBranch(child, objects, queryConfiguration, query);
    }
  }

  // Méthode pour retourner le label de l'objet en prenant l'URI de l'objet comme paramètre
  private getObjectLabel(objectURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      // Récupérer le type de l'objet avec la méthode getProperty
      const object = queryConfiguration.getProperty(objectURI);
      if (object) {
        return object.getLabel() || objectURI;
      } else {
        return objectURI;
      }
    } else {
      return objectURI;
    }
  }

  // Méthode pour récupérer les objets en utilisant les branches de la query
  private getObjectUri(
    query: ISparJson,
    queryConfiguration: any
  ): Record<string, string> {
    // Initialiser un objet pour stocker les objets et leurs types
    const objects: Record<string, string> = {};

    // Parcourir les branches de la query
    for (const branch of query.branches) {
      this.searchObjectInBranchURI(branch, objects, queryConfiguration, query);
    }

    return objects;
  }

  // Méthode pour parcourir les branches et les enfants pour trouver les objets
  private searchObjectInBranchURI(
    branch: any,
    objects: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter l'objet pour la propriété `o` de la branche
    if (query.variables.find((variable: any) => variable.value === line.o)) {
      objects[line.o] = line.oType;
    }
    // Ajouter également le sujet si nécessaire
    if (!(line.s in objects)) {
      objects[line.s] = line.sType;
    }

    // Parcourir les enfants de la branche recursivement
    for (const child of branch.children) {
      this.searchObjectInBranchURI(child, objects, queryConfiguration, query);
    }
  }

  //pour chaque bindingSet on va lire ses propriétés utilisant la structure de la query
  //pour garder la forme de la configuration de la query
  //on va lire les propriétés pour chaque branche une apres l'autre
  public readProperties(
    query: ISparJson,
    queryConfig: any,
    bindingSet: Parser.Binding[],
    predicates: Record<string, string>,
    objects: Record<string, string>
  ): Property[] {
    const propertiesList: Property[] = [];

    for (const branch of query.branches) {
      const properties = this.readPropertyForLine(
        branch,
        bindingSet,
        query,
        queryConfig,
        predicates,
        objects
      );
      for (const prop of properties) {
        propertiesList.push(prop);
      }
    }
    //ordonner les propriétés selon l'ordre des variables
    // Récupérer l'ordre des variables
    const variableOrder = query.variables.map(
      (variable: any) => variable.value
    );
    /*
    //pour que cela marche faut ajouter le nom de la colonne dans les properties de la class Property
    // Ordonner les propriétés en fonction de l'ordre des variables de la requête
    const ordredpropertiesList: Property[] = [];
    for (const variable of variableOrder) {
      const property = propertiesList.find((prop) => "Museum_1" === variable);
      if (property) {
        ordredpropertiesList.push(property);
      }
    }
    console.log("Properties list ordred", ordredpropertiesList);
*/
    return propertiesList;
  }

  // Méthode pour lire les propriétés pour une branche donnée
  public readPropertyForLine(
    branch: Branch,
    bindingSet: Parser.Binding[],
    query: ISparJson,
    queryConfig: any,
    predicates: Record<string, string>,
    objects: Record<string, string>
  ): Property[] {
    const propertiesList: Property[] = [];

    const objectVariable = branch.line.o;

    const value = this.getValueFromBindings(bindingSet, objectVariable);
    const predicatesURI = this.getPredicateURI(query, queryConfig);
    const objectU = this.getObjectUri(query, queryConfig);
    const valuesArray: PropertyValue[] = [];
    // si la valeur est un x-labelled-uri on va l'ajouter dans le tableau des valeurs
    if (
      value !== undefined &&
      value?.label !== undefined &&
      value?.type === "x-labelled-uri"
    ) {
      // Ajouter la valeur à valuesArray
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

    let predicate = new Property("", valuesArray, new ValueType("", ""), "");

    // Skip the property if value type is "uri"
    if (!this.isImageURI(value?.value)) {
      predicate = new Property(
        predicates[objectVariable] ?? "",
        valuesArray,
        new ValueType(objectU[objectVariable], objects[objectVariable]),
        predicatesURI[objectVariable] ?? ""
      );
    }

    if (branch.children && branch.children.length > 0) {
      const childrenProperties = branch.children.flatMap((child) =>
        this.readPropertyForLine(
          child,
          bindingSet,
          query,
          queryConfig,
          predicates,
          objects
        )
      );
      // Ajouter les propriétés enfants en tant que prédicats dans les PropertyValue de la propriété courante
      //faut verifier si la valeur est indefinie ou non

      if (value === undefined) {
        // Si la valeur est indéfinie, ajouter directement les enfants comme valeurs
        const valueWithChildren = new PropertyValue("", "", []);
        for (const childProp of childrenProperties) {
          valueWithChildren.addPredicate(childProp);
        }
        predicate.addValue(valueWithChildren);
      } else {
        // Si la valeur est définie, ajouter les enfants comme prédicats des PropertyValue
        for (const val of predicate.values) {
          for (const childProp of childrenProperties) {
            val.addPredicate(childProp);
          }
        }
      }
    }

    // Add the predicate only if it's not of type "uri"
    if (!this.isImageURI(value?.value)) {
      propertiesList.push(predicate);
    }

    return propertiesList;
  }

  //methode qui va permettre de fusionner les proprietes appartenant au meme objet principal
  private mergeProperties(existingProperty: Property, newProperty: Property) {
    // Iterate over the values of the new property
    for (const newValue of newProperty.values) {
      // Try to find a matching existing value
      const existingValue = existingProperty.values.find(
        (value) =>
          (value.label && newValue.label && value.label === newValue.label) ||
          (value.uri && newValue.uri && value.uri === newValue.uri) ||
          value.id === newValue.id
      );

      if (existingValue) {
        // If a matching value is found, merge the predicates and children recursively
        for (const predicate of newValue.predicates) {
          const existingPredicate = existingValue.predicates.find(
            (p) => p.uri === predicate.uri
          );

          if (existingPredicate) {
            // If a matching predicate is found, merge its children recursively
            this.mergeProperties(existingPredicate, predicate);
          } else {
            // If no matching predicate is found, add the new predicate
            existingValue.predicates.push(predicate);
          }
        }
      } else {
        // If no matching value is found, add the new value
        existingProperty.values.push(newValue);
      }
    }
  }

  // OK
  //recuperer la valeur d'une variable dans les bindings
  private getValueFromBindings(bindingSet: Parser.Binding[], variable: string) {
    for (const values of bindingSet) {
      if (values.hasOwnProperty(variable)) {
        return values[variable];
      }
    }
    return undefined;
  }

  //Ok
  // cette methode permet d'extraire l'uri du type de document à partir de la query
  public extractDocumentTypeURIFromQuery(
    branches: Array<any>
  ): string | undefined {
    for (const branch of branches) {
      if (branch.line && branch.line.sType) {
        return branch.line.sType;
      }
    }
    return undefined;
  }

  //ok
  // cette methode permet de recuperer le libéllé du type de document en utilisant son uri
  public getDocumentTypeLabel(
    documentTypeURI: string,
    queryConfiguration: any
  ): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getEntity === "function"
    ) {
      const entity = queryConfiguration.getEntity(documentTypeURI);
      if (entity) {
        return entity.getLabel() || documentTypeURI;
      } else {
        return documentTypeURI;
      }
    } else {
      return documentTypeURI;
    }
  }

  //ok
  // cette methode permet de recuperer l'icone du type de document en utilisant son uri
  public getDocumentTypeIconClass(
    documentTypeURI: string,
    queryConfiguration: any
  ): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getEntity === "function"
    ) {
      const entity = queryConfiguration.getEntity(documentTypeURI);
      if (entity) {
        return entity.getIcon() || documentTypeURI;
      } else {
        return documentTypeURI;
      }
    } else {
      return documentTypeURI;
    }
  }

  public extractResultData(
    bindings: Parser.Binding[],
    query: ISparJson,
    queryConfig: any
  ): ResultBoxM[] {
    const resultBoxes: ResultBoxM[] = [];
    if (!query && !queryConfig) {
      console.error("No query found");
      return [];
    }

    //recuperer l'URI du type de document
    const documentTypeURI = this.extractDocumentTypeURIFromQuery(
      query.branches
    );
    //recuperer le libéllé du type de document
    const documentTypeLabel = documentTypeURI
      ? this.getDocumentTypeLabel(documentTypeURI, queryConfig)
      : "";
    //recuperer l'icone du type de document
    const documentTypeIcon = this.getDocumentTypeIconClass(
      documentTypeURI ?? "",
      queryConfig
    );
    //creer un objet ResultBoxType "type de la boite de resultat"
    const type = new ResultBoxType(
      documentTypeURI ?? "",
      documentTypeLabel,
      documentTypeIcon
    );

    //search for the principal title column
    const principalColumnTitle = this.identifyPrincipalTitleColumn(
      query,
      bindings
    );
    //search for the principal image column
    const principalColumnImage = this.identifyPrincipalImageColumn(
      query,
      bindings
    );
    //get the predicates columns {o: p.label}
    const predicatesColumnLabel = this.getPredicate(query, queryConfig);
    //get the objects columns {o: oType.label}
    const objectsColumnLabel = this.getObject(query, queryConfig);

    //map to store the result boxes by title "Merged solution"
    const titleMap: Record<string, ResultBoxM> = {};

    for (const bindingSet of bindings) {
      const { title, uri } = this.extractMainTitleAndURI(
        bindingSet,
        principalColumnTitle
      );
      const predicates: Property[] = this.readProperties(
        query,
        queryConfig,
        [bindingSet],
        predicatesColumnLabel,
        objectsColumnLabel
      );
      const imageURI = this.extractMainImageURI(
        bindingSet,
        principalColumnImage
      );

      if (title in titleMap) {
        const existingBox = titleMap[title];
        for (const predicate of predicates) {
          const existingPredicate = existingBox.predicates.find(
            (p) => p.uri === predicate.uri
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
        const resultBox = new ResultBoxM(
          type,
          title,
          uri,
          imageURI ?? "",
          predicates
        );
        titleMap[title] = resultBox;
      }
    }

    for (const title in titleMap) {
      resultBoxes.push(titleMap[title]);
    }

    console.log("Result boxes", resultBoxes);
    return resultBoxes;
  }
}
