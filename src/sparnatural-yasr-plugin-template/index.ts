import { Plugin, DownloadInfo, SparnaturalPlugin } from "../";
import { drawSvgStringAsElement, drawFontAwesomeIconAsSvg, addClass, removeClass } from "../";
import { Yasr } from "../";
import { ISparJson } from "../ISparJson";

interface PersistentConfig {

}

interface PluginConfig {

}

export class MyTestPlugin implements SparnaturalPlugin<PluginConfig> {

	private yasr: Yasr;

	constructor(yasr: Yasr) {
    	this.yasr = yasr;

  	}

	public priority = 10;

	public getIcon() {
	  var svgContainer = document.createElement("div");
      svgContainer.className = "svgImg";
      // svgContainer.appendChild(svg);
      return svgContainer;
	}

	public draw(persistentConfig: PersistentConfig) {
		console.log("Plugin drawing !");
	}

	public canHandleResults() {
    	return !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
  	}

	public notifyQuery(sparnaturalQuery:ISparJson) {
		console.log("received query");
		console.log(sparnaturalQuery);
	}

	public notifyConfiguration(specProvider:any) {
		console.log("received specification provider from Sparnatural");
		console.log(specProvider);
	}
}