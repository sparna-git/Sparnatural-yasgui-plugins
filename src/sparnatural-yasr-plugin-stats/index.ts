import {
  SparnaturalPlugin,
  Yasr,
  drawFontAwesomeIconAsSvg,
  drawSvgStringAsElement,
} from "../../src/index";
import * as fas from "@fortawesome/free-solid-svg-icons/faChartPie";
import Parser from "../parsers/index";
import { TableXResults } from "../TableXResults";
import { DisplayStats } from "./DisplayStats";
import { ParseDataStats } from "./ParseDataStats";

interface PersistentConfig {}
interface PluginConfig {
  L18n: {};
}

export class StatsPlugin implements SparnaturalPlugin<PluginConfig> {
  private yasr: Yasr;
  private query: any;
  private displayStats = new DisplayStats();
  private parseDataStats = new ParseDataStats();
  private queryConfiguration: any;

  constructor(yasr: Yasr) {
    this.yasr = yasr;
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
  public priority = 3;
  public label = "Stats";

  // Add icon
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(fas));
  }

  public draw(persistentConfig: PersistentConfig) {
    console.log("Plugin drawing !");
    // Récupérer les résultats
    const results = new TableXResults(this.yasr.results as Parser);
    // Récupérer les bindings
    const bindings: Parser.Binding[] = results.getBindings();
    console.log("Bindings :", bindings);
    this.displayStats.displayStats(bindings, this.yasr.resultsEl);
  }

  //limiter ce plugin sur deux colonne si le nombre de colonne est superieur à 2 ne s'acctive pas
  //-----------------------------------!!!!!!!-----------------------------------
  public canHandleResults(): boolean {
    // Vérification initiale
    if (!this.query || !this.queryConfiguration) {
      return false;
    }

    // Obtention des bindings
    const bindings = this.yasr.results?.getBindings();
    if (!bindings) return false;

    // Validation des bindings
    for (const bindingSet of bindings) {
      for (const value of Object.values(bindingSet)) {
        if (typeof value === "object" && value !== null) {
          // Validation des variables de la requête
          return this.query.variables.some(
            (variable) =>
              variable.expression && typeof variable.expression === "object"
          );
        }
      }
    }
    return false;
  }

  // Notifier le plugin des changements dans les valeurs de query et queryConfiguration
  notifyQuery(sparnaturalQuery: any): any {
    this.query = sparnaturalQuery;
    console.log("Query :", this.query);
  }

  notifyConfiguration(specProvider: any): any {
    this.queryConfiguration = specProvider;
  }
}
