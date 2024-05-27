import { DisplayBoxHtml } from "./Display";
import { BindingParser } from "./BindingParser";
import {
  SparnaturalPlugin,
  Yasr,
  drawFontAwesomeIconAsSvg,
  drawSvgStringAsElement,
} from "../../src/index";
import * as faTh from "@fortawesome/free-solid-svg-icons/faTh";
import Parser from "../parsers/index";
import { TableXResults } from "../TableXResults";

interface PersistentConfig {
  //pageSize?: number;
  //parserPindings: BindingParser;
  //displayBoxHtml: DisplayBoxHtml;
}
interface PluginConfig {
  //parserPindings: BindingParser;
  //displayBoxHtml: DisplayBoxHtml;
  //pageSize?: number;
}
export class MyPluginGrid implements SparnaturalPlugin<PluginConfig> {
  private yasr: Yasr;
  private query: any;
  private queryConfiguration: any;
  private displayBoxHtml = new DisplayBoxHtml();
  private parserBinding = new BindingParser();

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
  public priority = 8;
  public label = "Grid";
  //add icon
  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faTh));
  }
  public draw(persistentConfig: PersistentConfig) {
    //verifications
    console.log("Plugin drawing !");
    //recuperer les resultats
    const results = new TableXResults(this.yasr.results as Parser);
    //recuperer les bindings
    const bindings: Parser.Binding[] = results.getBindings();
    //passer les bindings à la methode extractResultData de la classe BindingParser
    console.log("Bindings :", bindings);
    // resultBoxes contient les resultats sous forme de la structure de données ResultBox (voir ResultBox.ts)
    const resultBoxes = this.parserBinding.extractResultData(
      bindings,
      this.query,
      this.queryConfiguration
    );
    //afficher les resultats dans le plugin
    this.displayBoxHtml.displayResultBoxes(0, resultBoxes, this.yasr.resultsEl);
  }

  //verifier si le plugin peut afficher les resultats
  public canHandleResults(): boolean {
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
  }
  //notifier le plugin des changements dans les valeurs de query et queryConfiguration
  notifyQuery(sparnaturalQuery: any): any {
    this.query = sparnaturalQuery;
    console.log("Query :", this.query);
  }
  notifyConfiguration(specProvider: any): any {
    this.queryConfiguration = specProvider;
    console.log("Configuration query :", this.queryConfiguration);
  }
}
