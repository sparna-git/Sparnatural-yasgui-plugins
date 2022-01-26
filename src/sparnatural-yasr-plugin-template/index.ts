import { Plugin, DownloadInfo } from "../";
import { drawSvgStringAsElement, drawFontAwesomeIconAsSvg, addClass, removeClass } from "../";
import { Yasr } from "../";

interface PersistentConfig {

}

interface PluginConfig {

}

export class MyTable implements Plugin<PluginConfig> {

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
}