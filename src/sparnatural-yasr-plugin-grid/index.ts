import { BindingParser } from "./BindingParser";
import { DisplayBoxHtml } from "./Display";
import {
  SparnaturalPlugin,
  Yasr,
  drawFontAwesomeIconAsSvg,
  drawSvgStringAsElement,
} from "../../src/index";
import * as faTh from "@fortawesome/free-solid-svg-icons/faTh";
import Parser from "../parsers/index";
import { TableXResults } from "../TableXResults";

interface PluginConfig {
  lang: "en" | "fr";
}

export class GridPlugin implements SparnaturalPlugin<PluginConfig> {
  private yasr: Yasr;
  private query: any;
  private queryConfiguration: any;
  private parserBinding = new BindingParser();
  private displayBoxHtml = new DisplayBoxHtml();

  private config: PluginConfig;

  public static defaults: PluginConfig = {
    lang: "en",
  };

  constructor(yasr: Yasr) {
    this.yasr = yasr;
    this.config = GridPlugin.defaults;
  }

  download(filename?: string) {
    return {
      getData: () => this.yasr.results?.asCsv() || "",
      contentType: "text/csv",
      title: "Download result",
      filename: `${filename || "queryResults"}.csv`,
    };
  }

  helpReference?: string;
  public priority = 10;
  public label = "Grid";

  //add icon
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faTh));
  }

  public draw() {
    //recuperer les resultats
    const results = new TableXResults(this.yasr.results as Parser);
    //recuperer les bindings
    const bindings: Parser.Binding[] = results.getBindings();
    console.log("Bindings :", bindings);
    //passer les bindings à la methode extractResultData de la classe BindingParser
    // resultBoxes contient les resultats sous forme de la structure de données ResultBox (see Models Folder)
    const resultBoxes = this.parserBinding.extractResultData(
      bindings,
      this.query,
      this.queryConfiguration
    );

    //afficher les resultats dans le plugin
    this.displayBoxHtml.displayResultBoxes(0, resultBoxes, this.yasr.resultsEl);
  }

  /*
  public canHandleResults(): boolean {
    if (!this.query || !this.queryConfiguration) {
      return false;
    }
    // Vérifier si les variables de la query ont l'objet expression
    for (const variable of this.query.variables) {
      if (variable.expression && typeof variable.expression === "object") {
        return false;
      }
    }

    const bindings = this.yasr.results?.getBindings();
    if (!bindings) return false;

    for (const bindingSet of bindings) {
      for (const value of Object.values(bindingSet)) {
        if (
          typeof value === "object" &&
          value !== null &&
          (value as { type: string }).type === "uri"
        ) {
          return true;
        }
      }
    }

    return false;
  }*/

  public canHandleResults(): boolean {
    // Vérification initiale
    if (!this.query || !this.queryConfiguration) {
      return false;
    }

    // Vérifier si les variables de la query ont l'objet expression
    for (const variable of this.query.variables) {
      if (variable.expression && typeof variable.expression === "object") {
        return false;
      }
    }

    // Récupérer les bindings
    const bindings = this.yasr.results?.getBindings();
    if (!bindings) return false;

    // Vérifier les bindings pour les objets de type URI
    for (const bindingSet of bindings) {
      for (const value of Object.values(bindingSet)) {
        if (
          typeof value === "object" &&
          value !== null &&
          (value as { type: string }).type === "uri"
        ) {
          return true;
        }
      }
    }

    return false;
  }

  //notifier le plugin des changements dans les valeurs de query et queryConfiguration
  notifyQuery(sparnaturalQuery: any): any {
    this.query = sparnaturalQuery;
  }
  notifyConfiguration(specProvider: any): any {
    this.queryConfiguration = specProvider;
  }
}
