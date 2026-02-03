import { BindingParser } from "./BindingParser";
import { BindingParserV13 } from "./BindingParserV13";
import { DisplayBoxHtml } from "./Display";
import { DisplayBoxHtmlNew } from "./DisplayNew";
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
import { SparnaturalQuery } from "../SparnaturalQueryIfc-v13";

interface PluginConfig {
  lang: "en" | "fr";
}

interface PersistentConfig {}

export class GridPlugin implements SparnaturalPlugin<PluginConfig> {
  private yasr: Yasr;
  private query?: SparnaturalQuery;
  private queryConfiguration: any;
  //private parserBinding = new BindingParser();
  private parserBindingV13 = new BindingParserV13();
  //private displayBoxHtml = new DisplayBoxHtml();
  private displayBoxHtmlNew = new DisplayBoxHtmlNew();

  private config: PluginConfig;

  public static defaults: PluginConfig = {
    lang: "en",
  };

  constructor(yasr: Yasr) {
    this.yasr = yasr;
    this.config = GridPlugin.defaults;
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
    // init labels
    this.loadTranslations(this.config.lang);
    const results = new TableXResults(this.yasr.results as Parser);
    const bindings: Parser.Binding[] = results.getBindings();
    console.log(bindings);

    if (this.query) {
      const resultBoxes = this.parserBindingV13.extractResultData(
        bindings,
        this.query,
        this.queryConfiguration,
      );
      /*
      this.displayBoxHtml.displayResultBoxes(
        0,
        resultBoxes,
        this.yasr.resultsEl,
        I18n.labels
      );*/
      this.displayBoxHtmlNew.displayResultBoxes(
        0,
        resultBoxes,
        this.yasr.resultsEl,
        I18n.labels,
      );
    }
  }
  /*
  public canHandleResults1(): boolean {
    if (!this.query || !this.queryConfiguration) {
      return false;
    }

    for (const variable of this.query.variables) {
      if (
        variable["expression"] &&
        typeof variable["expression"] === "object"
      ) {
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
*/
  public canHandleResults(): boolean {
    if (!this.query || !this.queryConfiguration) {
      return false;
    }

    // Vérification si le sujet 's' de la première branche existe dans les variables de la requête
    const firstBranchSubject = this.query.where.subject.value;
    const variableValues = this.query.variables.map((v: any) => v.value);

    if (!firstBranchSubject || !variableValues.includes(firstBranchSubject)) {
      return false;
    }

    for (const variable of this.query.variables) {
      if (
        variable["expression"] &&
        typeof variable["expression"] === "object"
      ) {
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

  notifyQuery(sparnaturalQuery: SparnaturalQuery) {
    this.query = sparnaturalQuery;
    console.log("Stored query in GridPlugin:", this.query);
  }

  notifyConfiguration(specProvider: any): any {
    this.queryConfiguration = specProvider;
  }
}
