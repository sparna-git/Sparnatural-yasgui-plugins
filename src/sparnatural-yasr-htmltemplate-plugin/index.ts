import { Plugin, DownloadInfo } from "..";
import { drawSvgStringAsElement, drawFontAwesomeIconAsSvg, addClass, removeClass } from "..";
import { Yasr } from "..";
import Parser from "../parsers";
import * as Mustache from 'mustache';

interface PersistentConfig {

}

interface PluginConfig {
	resultTransformer: ((parser?:Parser) => any);
	htmlTemplate: string;
}

export class RowResultTransformerFactory {
	private rowSize:number;

	constructor(rowSize:number) {
		this.rowSize = rowSize;
	}

	public build():((parser?:Parser) => any) {
		let rowSize=this.rowSize

		type Rows = {
			rows: any[];
		};

		return function(parser?:Parser) {
			// return parser;
			let result:Rows = {
				rows:[]
			};
			var counter=0;
			(parser?.getBindings() as Parser.Binding[]).forEach(b => {
				if(counter%rowSize == 0) {
					result.rows.push({items:[]});
				}
				result.rows[result.rows.length-1].items.push(b);
				counter++;
			});
			return result;
		}
	}
}

export class HTMLTemplatePlugin implements Plugin<PluginConfig> {

	private yasr: Yasr;
	private config?: PluginConfig;

	public static defaults: PluginConfig = {
		resultTransformer: function(parser?:Parser) { return parser; },
		htmlTemplate: ""
	}

	constructor(yasr: Yasr) {
    	this.yasr = yasr;
		this.config = HTMLTemplatePlugin.defaults;
  	}

	public priority = 10;

	public getIcon() {
	  var svgContainer = document.createElement("div");
      svgContainer.className = "svgImg";
      // svgContainer.appendChild(svg);
      return svgContainer;
	}

	public draw(persistentConfig: PersistentConfig) {
		console.log("HTMLTemplatePlugin Plugin drawing ! template is "+this.config?.htmlTemplate);

		// first transform the result
		var transformedResult = (this.config?.resultTransformer)?this.config?.resultTransformer(this.yasr.results):this.yasr.results;

		var mustacheResult = Mustache.render(this.config?.htmlTemplate, transformedResult);
		
		var resultContainerEl = document.createElement("div");
		resultContainerEl.setAttribute("id","resultContainer");
		
		resultContainerEl.innerHTML = mustacheResult;
		
		console.dir(transformedResult)
		
		// var dummyDiv = document.createElement("div");
		// dummyDiv.innerHTML = JSON.stringify(this.yasr.results);
		// resultContainerEl.appendChild(dummyDiv);
		
		this.yasr.resultsEl.appendChild(resultContainerEl);
	}

	public canHandleResults() {
    	return !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
  	}
}