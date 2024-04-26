require("./index.scss");
import { Plugin, DownloadInfo, SparnaturalPlugin } from "..";
import {
  drawSvgStringAsElement,
  drawFontAwesomeIconAsSvg,
  addClass,
  removeClass,
} from "..";
import { Yasr } from "..";
import { ISparJson, Branch } from "../ISparJson";
import * as faTh from "@fortawesome/free-solid-svg-icons/faTh";
import { TableXResults } from "../TableXResults";
import Parser from "../parsers";
//config persistante a faire !!!!!!!!
interface PersistentConfig {
  pageSize?: number;
}
//config du plugin a faire !!!!!!!!
interface PluginConfig {
  pageSize?: number;
}
export class MyTestPluginGrid implements SparnaturalPlugin<PluginConfig> {
  private yasr: Yasr;
  private pageSize: number;
  //constructeur
  constructor(yasr: Yasr) {
    this.yasr = yasr;
    this.pageSize = 100; // Default page size
  }
  //fonction de téléchargement de fichier csv
  download(filename?: string) {
    return {
      getData: () => this.yasr.results?.asCsv() || "",
      contentType: "text/csv",
      title: "Download result",
      filename: `${filename || "queryResults"}.csv`,
    } as DownloadInfo;
  }
  helpReference?: string | undefined;
  public priority = 10;
  //nom de l'onglet
  public label = "Grid";
  //l'ajout de l'icone est ok
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faTh));
  }
  //it's ok here
  public draw(persistentConfig: PersistentConfig) {
    console.log("Plugin drawing !");
    // Clear previous results
    if (this.yasr && this.yasr.resultsEl) {
      this.yasr.resultsEl.innerHTML = "";
    }
    // Generate and display result boxes
    this.displayResultBoxes();
  }
  private displayResultBoxes() {

    // pre-process the result bindings to merge the label columns with the URI columns
    var results = new TableXResults(this.yasr.results as Parser);

    // Assume results are available in this.yasr.results.getBindings()
    const bindings:Parser.Binding[] = results.getBindings();
    if (!bindings) return;
    // Calculate the start index based on the current page size
    const startIndex = 0;
    // Calculate the end index based on the current page size
    const endIndex = Math.min(this.pageSize, bindings.length);
    // Create a grid layout for result boxes
    const gridContainer = document.createElement("div");
    gridContainer.className = "result-grid";
    // Loop through each result within the specified range and create a box for it
    for (let i = startIndex; i < endIndex; i++) {
      const bindingSet = bindings[i];
      const resultBox = this.createResultBox(bindingSet);
      gridContainer.appendChild(resultBox);
    }
    // Append the grid layout to the results element
    this.yasr.resultsEl.appendChild(gridContainer);
    // Check if there are more results to load
    if (endIndex < bindings.length) {
      // If yes, add a "Load More" button
      this.addLoadMoreButton();
    } else {
      // Otherwise, display end message and add a button to return to the top
      const endMessage = document.createElement("div");
      endMessage.textContent = "C'est la fin des résultats.";
      endMessage.classList.add("end-message");
      const returnToTopButton = document.createElement("button");
      returnToTopButton.textContent = "Retour au début";
      returnToTopButton.classList.add("return-to-top-button");
      returnToTopButton.addEventListener("click", () => {
        window.scrollTo(0, 0); // Scroll to the top of the page
      });
      this.yasr.resultsEl.appendChild(endMessage);
      this.yasr.resultsEl.appendChild(returnToTopButton);
    }
  }
  //fonction pour créer les boites de résultats
  private createResultBox(bindingSet: Parser.Binding): HTMLDivElement {
    const resultBox = document.createElement("div");
    resultBox.className = "result-box";

    // insérer le titre de la box en allant le récupérer
    const keyValueElement = document.createElement("div");
    keyValueElement.innerHTML = `<strong>${this.getResultBoxTitle(bindingSet)}</strong>`;
    resultBox.appendChild(keyValueElement);

    // Parcourir chaque clé dans le binding set
    for (const key in bindingSet) {
      if (Object.prototype.hasOwnProperty.call(bindingSet, key)) {
        const value = bindingSet[key];
        // Vérifier si la valeur est une chaîne ou un littéral
        if (typeof value === "string" || (value && value.type === "literal")) {
          // Créer un élément pour afficher la clé et la valeur
          const keyValueElement = document.createElement("div");
          keyValueElement.innerHTML = `<strong>${value.value}</strong>`;
          resultBox.appendChild(keyValueElement);
        } else if(value.type === "x-labelled-uri") {
          const keyValueElement = document.createElement("div");
          keyValueElement.innerHTML = `<a href="${value.value}">${value.label}</a>`;
          resultBox.appendChild(keyValueElement);
        }
      }
    }
    // Ajouter le bouton de consultation
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consult";
    consultButton.addEventListener("click", () => {
      const resourceLink = this.getResourceLink(bindingSet);
      window.open(resourceLink, "_blank");
    });
    resultBox.appendChild(consultButton);
    return resultBox;
  }

  getResultBoxTitle(bindingSet: Parser.Binding): string {
    return "toto";
  }


  private getResourceLink(bindingSet: Parser.Binding): string {
    // Find the first column in the result table containing URIs
    for (const value of Object.values(bindingSet)) {
      if (
        typeof value === "object" &&
        value !== null &&
        ( value.type === "uri" || value.type === "x-labelled-uri")
      ) {
        return value.value;
      }
    }
    return "";
  }
  private addLoadMoreButton() {
    // Create a button element
    const loadMoreButton = document.createElement("button");
    loadMoreButton.textContent = "Load More";
    loadMoreButton.className = "load-more-button";
    // Add event listener to load more results when clicked
    loadMoreButton.addEventListener("click", () => {
      // Increment the page size
      this.pageSize += 100;
      // Remove the existing "Load More" button
      //this.yasr.resultsEl.removeChild(loadMoreButton);
      // Clear the current results
      this.yasr.resultsEl.innerHTML = "";
      // Redraw the result boxes with the updated page size
      this.displayResultBoxes();
    });
    // Append the button to the results element
    this.yasr.resultsEl.appendChild(loadMoreButton);
  }
  public canHandleResults(): boolean {
    const bindings = this.yasr.results?.getBindings();
    if (!bindings) return false;
    // Check if any of the columns contain URIs
    for (const bindingSet of bindings) {
      for (const value of Object.values(bindingSet)) {
        if (
          typeof value === "object" &&
          value !== null &&
          (value as { type: string }).type === "uri"
        ) {
          console.log("canHandleResults: true");
          return true;
        }
      }
    }
    return false;
  }
  private query: any;
  notifyQuery(sparnaturalQuery: ISparJson): void {
    console.log("received query");
    console.log("query : ", sparnaturalQuery);
    //Stocker la requete dans une variable
    this.query = sparnaturalQuery;
  }

  private queryConfiguration: any;
  notifyConfiguration(specProvider: any) {
    console.log("received specification provider from Sparnatural");
    console.log(specProvider);
    // Stockez la configuration dans une variable
    this.queryConfiguration = specProvider;
    console.log("Query configuration:", this.queryConfiguration);
  }
}
