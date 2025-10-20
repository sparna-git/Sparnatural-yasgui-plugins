import Parser from "../parsers";
import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
import { ValueType } from "./Models/ValueType";
import { PropertyValue } from "./Models/PropertyValue";
import { ResultBoxType } from "./Models/ResultBoxType";

import { Branch, ISparJson } from "../ISparJson";
import { value } from "./old-backup/Models/value";
const im = require("./image-defaults/imageNone.jpg");

export class BindingParser {
  constructor() {}

  //cette methode devra prendre le premier sujet dans la requete comme titre principal
  private identifyMainTitleColumn(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    // Vérifier si la requête est disponible et si elle contient des variables
    if (!query || !query.variables || query.variables.length === 0) {
      console.error("Aucune variable trouvée dans la requête.");
      return undefined;
    }
    // Vérifier si la requête contient des branches
    if (!query.branches || query.branches.length === 0) {
      console.error("Aucune branche trouvée dans la requête.");
      return undefined;
    }
    // Vérifier si la première branche a un sujet
    if (!query.branches[0].line || !query.branches[0].line.s) {
      console.error(
        "Aucun sujet trouvé dans la première branche de la requête."
      );
      return undefined;
    }
    // Retourner le sujet de la première branche comme titre principal
    console.log("Main title column:", query.branches[0].line.s);
    return query.branches[0].line.s;
  }

  //OK
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
      // try to find the label key if x-labelled-uri, otherwise take the value key
      mainTitle = (value.label ? value.label : value.value) ?? "";
      mainURI = value.value ?? "";
    }
    //we are ensure that at the return we will have a title and an uri
    return { title: mainTitle, uri: mainURI };
  }

  //OK
  // Méthode pour identifier la colonne de l'image principale
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

  //OK
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

  //OK
  //verifier si une uri est une uri d'image ou non RegularExpression
  private isImageURI(uri: string | undefined): boolean {
    if (!uri) {
      return false;
    }
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }

  //OK
  // une fois trouver la colonne de l'image principale on va extraire l'uri de l'image sur le bindingset
  //partie lecture
  //methode appelée dans la methode extractResultData
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

  //OK
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

  //OK
  // Méthode pour parcourir les branches et les enfants pour trouver les prédicats
  private searchInBranch(
    branch: any,
    predicates: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter le prédicat pour la propriété `o` de la branche
    if (line && line.o) {
      //recuperer le libelle du prédicat en utilisant la methode getLabelpre
      const predicateLabel = this.getLabelpre(line.p, queryConfiguration);
      predicates[line.o] = predicateLabel;
    }

    // Ajouter également le sujet si nécessaire (cette partie est optionnelle)
    if (line && line.s && !(line.s in predicates)) {
      predicates[line.s] = "";
    }

    // Parcourir les enfants de la branche recursivement
    if (branch.children && branch.children.length > 0) {
      for (const child of branch.children) {
        this.searchInBranch(child, predicates, queryConfiguration, query);
      }
    }
  }

  //OK
  // Méthode pour retourner le label du prédicat en prenant le prédicat comme paramètre
  private getLabelpre(predicateURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      // Récupérer le label du predicat avec la méthode getProperty et ensuite getLabel
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

  //OK
  // Méthode pour récupérer les prédicats URIs en utilisant les branches de la query
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

  //OK
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
    if (line && line.o) {
      predicates[line.o] = line.p;
    }

    // Ajouter également le sujet si nécessaire
    if (line && line.s && !(line.s in predicates)) {
      predicates[line.s] = "";
    }

    // Parcourir les enfants de la branche
    if (branch.children && branch.children.length > 0) {
      for (const child of branch.children) {
        this.searchInBranchURI(child, predicates, queryConfiguration, query);
      }
    }
  }

  //OK
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

  //OK
  // Méthode pour parcourir les branches et les enfants pour trouver les objets
  private searchObjectInBranch(
    branch: any,
    objects: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter l'objet pour la propriété `o` de la branche
    if (
      line &&
      line.o &&
      query.variables.find((variable: any) => variable.value === line.o)
    ) {
      const objectTypeLabel = this.getEntityLabel(
        line.oType,
        queryConfiguration
      );
      objects[line.o] = objectTypeLabel;
    }
    // Ajouter également le sujet si nécessaire
    if (line && line.s && !(line.s in objects)) {
      const subjectTypeLabel = this.getEntityLabel(
        line.sType,
        queryConfiguration
      );
      objects[line.s] = subjectTypeLabel;
    }
    // Parcourir les enfants de la branche recursivement
    if (branch.children && branch.children.length > 0) {
      for (const child of branch.children) {
        this.searchObjectInBranch(child, objects, queryConfiguration, query);
      }
    }
  }

  //OK
  // Méthode pour retourner le label de l'objet en prenant l'URI de l'objet comme paramètre
  private getEntityLabel(entityURI: string, queryConfiguration: any): string {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getProperty === "function"
    ) {
      // Récupérer le type de l'objet avec la méthode getProperty
      const object = queryConfiguration.getEntity(entityURI);
      if (object) {
        return object.getLabel() || entityURI;
      } else {
        return entityURI;
      }
    } else {
      return entityURI;
    }
  }

  //OK
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

  //OK
  // Méthode pour parcourir les branches et les enfants pour trouver les objets
  private searchObjectInBranchURI(
    branch: any,
    objects: Record<string, string>,
    queryConfiguration: any,
    query: any
  ): void {
    const line = branch.line;

    // Ajouter l'objet pour la propriété `o` de la branche
    if (
      line &&
      line.o &&
      query.variables.find((variable: any) => variable.value === line.o)
    ) {
      objects[line.o] = line.oType;
    }
    // Ajouter également le sujet si nécessaire
    if (line && line.s && !(line.s in objects)) {
      objects[line.s] = line.sType;
    }

    // Parcourir les enfants de la branche recursivement
    if (branch.children && branch.children.length > 0) {
      for (const child of branch.children) {
        this.searchObjectInBranchURI(child, objects, queryConfiguration, query);
      }
    }
  }

  //OK
  // Méthode pour lire les propriétés pour une les bindingSet
  // a voir pour changer la logique de la methode (...rest)
  public readProperties(
    query: ISparJson,
    queryConfig: any,
    bindingSet: Parser.Binding[],
    predicates: Record<string, string>,
    objects: Record<string, string>
  ): Property[] {
    const propertiesList: Property[] = [];

    // Lire les propriétés pour chaque branche du query
    for (const branch of query.branches) {
      const properties = this.readPropertyForLine(
        branch,
        bindingSet,
        query,
        queryConfig,
        predicates,
        objects
      );
      propertiesList.push(...properties); // Ajouter les propriétés à propertiesList
    }

    // Récupérer l'ordre des variables à partir de query.variables
    const variableOrder = query.variables.map(
      (variable: any) => variable.value
    );
    //const variableOR = variableOrder.slice(1);

    // Ordonner les propriétés en fonction de l'ordre des variables
    let ordredpropertiesList: Property[] = [];

    //appeler la methode ordredpropertiesListfun pour ordonner les propriétés en fonction de l'ordre de la configuration
    ordredpropertiesList = this.ordredpropertiesListfun(
      variableOrder,
      propertiesList
    );

    return ordredpropertiesList; // Retourner la liste ordonnée des propriétés
  }

  //OK
  //methode qui va permettre de trier les propriétés en fonction de l'ordre de la configuration de la requête
  private ordredpropertiesListfun(
    variableOrder: any,
    propertiesList: Property[]
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
    //une fois les propriétés scindées on va les trier en fonction de l'ordre de variableOrder
    //au retour on aura sortedInOrderProperties qui contient les propriétés triées en fonction de l'ordre de variableOrder
    const sortedInOrderProperties = inOrderProperties.sort((a, b) => {
      const aIndex = variableOrder.indexOf(a.column);
      const bIndex = variableOrder.indexOf(b.column);
      return aIndex - bIndex;
    });

    //de meme facon pour les fils
    // Trier récursivement les fils de chaque propriété
    for (const property of sortedInOrderProperties) {
      for (const value of property.values) {
        if (value.predicates.length > 0) {
          value.predicates = this.ordredpropertiesListfun(
            variableOrder,
            value.predicates
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
            value.predicates
          );
        }
      }
    }

    // Combiner les deux listes : les propriétés en ordre d'abord, puis les hors ordre
    return [...sortedInOrderProperties, ...outOfOrderProperties];
  }

  //OK
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

    // Add null check for branch.line
    if (!branch || !branch.line) {
      return propertiesList;
    }

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
      (value?.type === "literal" || value?.type === "typed-literal")
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

    let predicate = new Property(
      "",
      valuesArray,
      new ValueType("", ""),
      "",
      objectVariable
    );

    // Skip the property if value type is "ImageUri"
    if (!this.isImageURI(value?.value)) {
      predicate = new Property(
        predicates[objectVariable] ?? "",
        valuesArray,
        new ValueType(objectU[objectVariable], objects[objectVariable]),
        predicatesURI[objectVariable] ?? "",
        objectVariable
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

  //OK
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

  //OK
  // cette methode permet d'extraire l'uri du type de document à partir de la query
  public extractDocumentTypeURIFromQuery(
    branches: Array<any>
  ): string | undefined {
    for (const branch of branches) {
      if (branch && branch.line && branch.line.sType) {
        return branch.line.sType;
      }
    }
    return undefined;
  }

  //OK
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

  /**
   *
   * @param documentTypeURI
   * @param queryConfiguration
   * @returns l'icone du type de document en utilisant son uri, ou bien undefined s'il n'y a pas d'icône
   */
  public getDocumentTypeIconClass(
    documentTypeURI: string,
    queryConfiguration: any
  ): string | undefined {
    if (
      queryConfiguration &&
      typeof queryConfiguration.getEntity === "function"
    ) {
      const entity = queryConfiguration.getEntity(documentTypeURI);
      if (entity) {
        return entity.getIcon() || undefined;
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  //OK
  //The main methode of this class
  //this methode will use all the previous methode to extract the result data and return our data structure ResultBoxM[]
  public extractResultData(
    bindings: Parser.Binding[],
    query: ISparJson,
    queryConfig: any
  ): ResultBoxM[] {
    // Initialiser un tableau pour stocker les ResultBoxM
    const resultBoxes: ResultBoxM[] = [];

    // Vérifier si la query et la configuration de la query sont disponibles
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
      documentTypeIcon ?? ""
    );

    //search for the principal title column
    const principalColumnTitle = this.identifyMainTitleColumn(query, bindings);
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

    //parcourir les bindings pour extraire les resultats
    for (const bindingSet of bindings) {
      //extraire le titre principal et l'uri
      const { title, uri } = this.extractMainTitleAndURI(
        bindingSet,
        principalColumnTitle
      );

      //extraire les prédicats
      const predicates: Property[] = this.readProperties(
        query,
        queryConfig,
        [bindingSet],
        predicatesColumnLabel,
        objectsColumnLabel
      );
      //extraire l'uri de l'image principale
      const imageURI = this.extractMainImageURI(
        bindingSet,
        principalColumnImage
      );

      //merger les resultats par titre "Merged solution"
      if (uri in titleMap && title !== "") {
        const existingBox = titleMap[uri];
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
        if (title !== "") {
          //creer un objet ResultBoxM pour chaque titre
          const resultBox = new ResultBoxM(
            type,
            title,
            uri,
            imageURI ?? "",
            predicates
          );
          //maper le resultBox par titre "Merged solution"
          titleMap[uri] = resultBox;
        }
      }
    }

    //ajouter les resultats de la mergedMaps dans le tableau des resultats
    for (const uri in titleMap) {
      resultBoxes.push(titleMap[uri]);
    }

    //
    //retourner les resultats 'Vérification'
    console.log("Result boxes", resultBoxes);
    return resultBoxes;
  }
}

/*
  //OK
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
      const pairsToCheck = Math.ceil((totalResults) / 10);
      /*
      console.log("pairsToCheck", pairsToCheck);
      console.log("pairsToCheck * 2", pairsToCheck * 2);
      console.log("totalResults", totalResults);
      */
// Vérifier les paires de résultats
/*for (let i = 0; i < totalResults; i += 10) {
        const indicesToCheck = [i, i + 1];
        for (const index of indicesToCheck) {
          if (index < totalResults && bindings[index][variableName]) {
            const value = bindings[index][variableName];
            //la condition pour que la colonne soit valide c'est que les 10 premiers couple de resultats (pairs to check 20) doivent etre des x-labelled-uri
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
      //i have added the condition -1 to avoid the case when the last couple of results are not valid
      //exemple we have 121 box to check when we reach 121 we will have validCount < pairsToCheck * 2
      //so we will minus 1 to avoid this case and to have a valid column title
      //to try to avoid the case when the last couple of results are not valid remov the -1 from the condition
      if (validCount >= pairsToCheck * 2 - 1) {
        return variableName;
      }
    }
    // If no valid column is found, log an error and return undefined
    console.error(
      "Impossible de trouver une colonne de titre avec des informations de type x-labelled-uri."
    );
    return undefined;
  }
  
  //this methode will be change, to get the main title we use the fisrt subjet as main title 'the first column'
  private identifyMainTitleColumn1(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    // Vérifier si la requête est disponible et si elle contient des variables
    if (!query || !query.variables || query.variables.length === 0) {
      console.error("Aucune variable trouvée dans la requête.");
      return undefined;
    }
    // Définir la tolérance aux erreurs (pourcentage de valeurs non conformes acceptables)
    const errorTolerance = 0.05; // 5%

    // Parcourir toutes les variables de la requête
    for (const variable of query.variables) {
      const variableName = variable.value;
      let validCount = 0;
      let totalChecked = 0;
      const totalResults = bindings.length;

      for (let i = 0; i < totalResults; i += 10) {
        const indicesToCheck = [i, i + 1];
        for (const index of indicesToCheck) {
          if (index < totalResults && bindings[index][variableName]) {
            const value = bindings[index][variableName];
            if (value.type === "x-labelled-uri") {
              validCount++;
            }
            totalChecked++;
          }
        }
      }

      // Calculer le pourcentage de valeurs valides
      const validPercentage = validCount / totalChecked;

      // Si le pourcentage de valeurs valides dépasse le seuil toléré, retourner le nom de la variable
      if (validPercentage >= 1 - errorTolerance) {
        return variableName;
      }
    }

    console.warn(
      "Cannot find a column of type x-labelled-uri - will use the first column as title column"
    );

    // no x-labelled-uri column found
    // take the first variable in the result set
    return query.variables[0].value;
  }
  
  */
