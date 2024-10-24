import Parser from "../../parsers";
import { ResultBox } from "./Models/ResultBox";
import { Propertie } from "./Models/Propertie";
import { Branch, ISparJson } from "../../ISparJson";
const im = require("../sparnatural-yasr-plugin-grid/image-defaults/imageNone.jpg");
export class BindingParser {
  constructor() {}

  private identifyPrincipalTitleColumn(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    if (!query || !query.variables || query.variables.length === 0) {
      console.error("Aucune variable trouvée dans la requête.");
      return undefined;
    }

    // Parcourir toutes les variables de la requête
    for (const variable of query.variables) {
      const variableName = variable.value;

      // Initialiser un compteur pour les résultats valides
      let validCount = 0;

      // Calculer le nombre de paires à vérifier en fonction du nombre total de résultats
      const totalResults = bindings.length;
      const pairsToCheck = Math.ceil(totalResults / 10);
      console.log("pairsToCheck", pairsToCheck);
      console.log("pairsToCheck * 2", pairsToCheck * 2);
      console.log("totalResults", totalResults);

      // Vérifier les paires de résultats
      for (let i = 0; i < totalResults; i += 10) {
        const indicesToCheck = [i, i + 1];

        for (const index of indicesToCheck) {
          if (index < totalResults && bindings[index][variableName]) {
            const value = bindings[index][variableName];
            if (value.type === "x-labelled-uri") {
              validCount++;
            } else {
              validCount = 0; // Reset the counter if any value is not "x-labelled-uri"
              break;
            }
          }
        }

        // If any of the 10 result pairs are invalid, continue to the next variable
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

    console.error(
      "Impossible de trouver une colonne de titre avec des informations de type x-labelled-uri."
    );
    return undefined;
  }

  private extractMainTitleAndURI(
    bindingSet: Parser.Binding,
    principalColumnTitle: any
  ): {
    title: string;
    uri: string;
  } {
    let mainTitle = "";
    let mainURI = "";
    if (principalColumnTitle && bindingSet[principalColumnTitle]) {
      const value = bindingSet[principalColumnTitle];
      mainTitle = value.label ?? "";
      mainURI = value.value ?? "";
    }
    return { title: mainTitle, uri: mainURI };
  }

  // a modifier pour la nouvelle structure si la collone contient
  // une liste des valeurs on predn pas cette colonne en conseideration
  private identifyPrincipalImageColumn(
    query: any,
    bindings: Parser.Binding[]
  ): string | undefined {
    if (query && query.variables && query.variables.length > 0) {
      for (const variable of query.variables) {
        //parcourir les 10 premier bindings pour identifier la colonne de l'image principale
        //en cherchant une uri d'image dans les bindings de chaque variable
        //limiter la recherche à 10 bindings pour éviter de parcourir tous les bindings
        //on recupere l'image qui appartient à la branche principale

        const bind = bindings.slice(0, 10);
        for (const bindingSet of bind) {
          if (bindingSet[variable.value]) {
            const value = bindingSet[variable.value];
            if (value.type === "uri" && this.isImageURI(value.value)) {
              return variable.value;
            }
          }
        }
      }
    }
    return undefined;
  }

  //OK
  //verifier si une uri est une uri d'image
  private isImageURI(uri: string): boolean {
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }

  //OK
  //il manque le test si la colonne de l'image est optionnelle

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
    //sinon on renvoie pas le predicate
    if (
      query.variables.find((variable: any) => variable.value === line.o) ||
      line.o
    ) {
      const predicateLabel = this.getLabelpre(line.p, queryConfiguration);
      predicates[line.o] = predicateLabel;
    }

    // Ajouter également le sujet si nécessaire
    if (!(line.s in predicates)) {
      //const subjectTypeLabel = this.getLabelpre(line.p, queryConfiguration);
      //predicates[line.o] = subjectTypeLabel;
      predicates[line.s] = "";
    }

    // Parcourir les enfants de la branche
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
      console.log("objects", objects[line.s]);
    }

    // Parcourir les enfants de la branche
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
      // Essayer avec une entity
      const entity = queryConfiguration.getEntity(objectURI);
      if (entity) {
        return entity.getLabel() || objectURI;
      }

      // Essayer avec une property
      const property = queryConfiguration.getProperty(objectURI);
      if (property) {
        return property.getLabel() || objectURI;
      }

    }
    // default : return objectURI
    return objectURI;
  }

  //methode qui vas permettre de faire un traitement sur les bindings
  //pour extraire pour le titre principal tout les predicat qui y'appaartient
  public traitementBindingForTitle(
    query: ISparJson,
    bindings: Parser.Binding[]
  ) {}

  public readProperties(
    query: ISparJson,
    bindings: Parser.Binding[],
    predicates: Record<string, string>,
    objects: Record<string, string>
  ): Propertie[] {
    // itérer sur les branches de la query
    // appeler readPropertyForLine pour chaque branche
    // en v2, ici : retrier les properties par rapport à l'ordre des colonnes dans la query
    // Initialiser la liste des propriétés
    const propertiesList: Propertie[] = [];

    for (const branch of query.branches) {
      const properties = this.readPropertyForLine(
        branch,
        bindings,
        query,
        predicates,
        objects
      );
      propertiesList.push(...properties);
    }
    return propertiesList;
  }

  public readPropertyForLine(
    branch: Branch,
    bindings: Parser.Binding[],
    query: ISparJson,
    predicates: Record<string, string>,
    objects: Record<string, string>
  ): Propertie[] {
    // regarder le champ "o" de la ligne de la branche
    // regarder si cette variable "o" fait partie des variables sélectionnées dans la query
    // si non, retourner null ou undefined
    // si oui, construire la Property
    // 1. label du prédicat
    // 2. aller chercher la valeur de cette colonne dans le bindingset
    // itérer sur les "children" de la branche
    // pour chaque children, rappeler cette même fonction readPropertyForLine récusrivement
    const propertiesList: Propertie[] = [];

    // Vérifier si la variable "o" fait partie des variables sélectionnées dans la query
    const objectVariable = branch.line.o;

    //verifier si la variable "o" fait partie des variables sélectionnées dans la query ou elle presente dans la branch
    const value = this.getValueFromBindings(bindings, objectVariable);
    if (value === undefined) {
      // Si la valeur est undefined mais la branche a des enfants, créer la propriété et traiter les enfants
      const predicate = new Propertie(
        predicates[objectVariable] ?? "c",
        "", // Pas de valeur associée car la branche n'a pas de valeur
        "", // Pas de URI associé car la branche n'a pas de valeur
        objects[objectVariable] ?? "c" // Type de l'objet
      );
      propertiesList.push(predicate);

      if (branch.children && branch.children.length > 0) {
        const childrenProperties = branch.children.flatMap((child) =>
          this.readPropertyForLine(child, bindings, query, predicates, objects)
        );
        predicate.children.push(...childrenProperties);
      }
    } else {
      let predicate = new Propertie("", "", "", "");
      if (value.type === "literal") {
        // Si la valeur est définie, créer la propriété normalement avec la valeur associée
        predicate = new Propertie(
          predicates[objectVariable] ?? "c",
          value.value ?? "",
          "",
          objects[objectVariable] ?? "" // Type de l'objet
        );
        propertiesList.push(predicate);
      } else {
        // Si la valeur est définie, créer la propriété normalement avec la valeur associée
        predicate = new Propertie(
          predicates[objectVariable] ?? "c",
          value.label ?? "",
          value.value ?? "",
          objects[objectVariable] ?? "" // Type de l'objet
        );
        propertiesList.push(predicate);
      }

      // Si la branche a des enfants, traiter les enfants récursivement
      if (branch.children && branch.children.length > 0) {
        const childrenProperties = branch.children.flatMap((child) =>
          this.readPropertyForLine(child, bindings, query, predicates, objects)
        );
        predicate.children.push(...childrenProperties);
      }
    }

    return propertiesList;
  }
  //OK
  private getValueFromBindings(bindings: Parser.Binding[], variable: string) {
    for (const binding of bindings) {
      if (binding.hasOwnProperty(variable)) {
        return binding[variable];
      }
    }
    return undefined;
  }

  //Ok
  // cette methode permet d'extraire le type de document d'une query
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

  //--------------------------------------------------------------------------------
  public extractResultData(
    bindings: Parser.Binding[],
    query: ISparJson,
    queryConfig: any
  ): ResultBox[] {
    const resultBoxes: ResultBox[] = [];

    // Vérifier si la requête existe
    if (!query && !queryConfig) {
      console.error("No query found");
      return [];
    }

    //extraction de l'uri pour le type de document et icon
    const documentTypeURI = this.extractDocumentTypeURIFromQuery(
      query.branches
    );
    //Passer l'uri du type de document à la methode getDocumentTypeLabel
    //pour recuperer le libéllé du type de document
    const documentTypeLabel = documentTypeURI
      ? this.getDocumentTypeLabel(documentTypeURI, queryConfig)
      : "";
    //Passer l'uri du type de document à la methode getDocumentTypeIconClass
    //pour recuperer l'icone du type de document
    const documentTypeIcon = this.getDocumentTypeIconClass(
      documentTypeURI ?? "",
      queryConfig
    );
    //identifier la colonne du titre principal
    const principalColumnTitle = this.identifyPrincipalTitleColumn(
      query,
      bindings
    );
    console.log("principalColumnTitle", principalColumnTitle);
    //identifier la colonne de l'image principale
    const principalColumnImage = this.identifyPrincipalImageColumn(
      query,
      bindings
    );
    console.log("principalColumnImage", principalColumnImage);

    //recuperation des prédicats pour les encadrés de résultats
    const predicatesS = this.getPredicate(query, queryConfig);
    console.log("predicates : ", predicatesS);

    //recuperation des objets pour les encadrés de résultats
    const objectsS = this.getObject(query, queryConfig);
    console.log("objects : ", objectsS);

    for (const bindingSet of bindings) {
      //indexation des titres et uri pour les encadrés de résultats en utilisant
      //la colonne du titre principal
      const { title, uri } = this.extractMainTitleAndURI(
        bindingSet,
        principalColumnTitle
      );

      //--------------------------------------------------------------------------------
      //recuperation des prédicats pour les encadrés de résultats
      // a changer ici // methode readProperties et readPropertyForLine
      const predicates: Propertie[] = this.readProperties(
        query,
        [bindingSet],
        predicatesS,
        objectsS
      );
      //--------------------------------------------------------------------------------

      //indexation des images pour les encadrés de résultats en utilisant
      //la colonne de l'image principale
      const imageURI = this.extractMainImageURI(
        bindingSet,
        principalColumnImage
      );

      //construction de la structure de données pour chaque encadré
      const resultBox = new ResultBox(
        documentTypeIcon,
        documentTypeLabel,
        title,
        uri,
        imageURI ?? "", // Utiliser l'URI de l'image s'il existe, sinon utiliser une chaîne vide
        predicates
      );
      //ajouter chaque encadré à la liste des encadrés
      resultBoxes.push(resultBox);
    }
    console.log("Result boxes", resultBoxes);
    //retourner la liste des encadrés
    return resultBoxes;
  }
}
