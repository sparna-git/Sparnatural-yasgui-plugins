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
import { I18n } from "./I18n";

interface PluginConfig {
  lang: "en" | "fr";
}

interface PersistentConfig {}

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
    this.loadTranslations(this.config.lang);
  }

  private async loadTranslations(lang: string) {
    await I18n.init(lang);
  }

  private getTranslation(key: string): string {
    return I18n.labels ? I18n.labels[key] || key : key;
  }

  download(filename?: string) {
    return {
      getData: () => this.yasr.results?.asCsv() || "",
      contentType: "text/csv",
      title: this.getTranslation("Download result"),
      filename: `${filename || "queryResults"}.csv`,
    };
  }

  helpReference?: string;
  public priority = 10;
  public label = "Grid";

  public getIcon() {
    return drawSvgStringAsElement(drawFontAwesomeIconAsSvg(faTh));
  }

  public draw(PersistentConfig: PersistentConfig) {
    const results = new TableXResults(this.yasr.results as Parser);
    const bindings: Parser.Binding[] = results.getBindings();
    console.log("Bindings :", bindings);

    const resultBoxes = this.parserBinding.extractResultData(
      bindings,
      this.query,
      this.queryConfiguration
    );

    this.displayBoxHtml.displayResultBoxes(
      0,
      resultBoxes,
      this.yasr.resultsEl,
      I18n.labels
    );
  }

  public canHandleResults(): boolean {
    /*
    if (!this.query || !this.queryConfiguration) {
      return false;
    }*/

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
  }

  notifyQuery(sparnaturalQuery: any): any {
    this.query = sparnaturalQuery;
  }

  notifyConfiguration(specProvider: any): any {
    this.queryConfiguration = specProvider;
  }
}
