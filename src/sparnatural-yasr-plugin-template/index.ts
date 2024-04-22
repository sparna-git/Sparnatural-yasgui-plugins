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

	/**
	 * Cette méthode est celle qui affiche les résultats.
	 * On peut écrire un bout de HTML dans this.yasr.resultsEl : this.yasr.resultsEl.appendChild(...);
	 * 
	 * @param persistentConfig 
	 */
	public draw(persistentConfig: PersistentConfig) {
		console.log("Plugin drawing !");
		var resultContainerEl = document.createElement("div");		
		resultContainerEl.innerHTML = "Hello this is <strong>MyTestPlugin !!!</strong>";
		
		this.yasr.resultsEl.appendChild(resultContainerEl);
	}

	/**
	 * Cette méthode est appelée pour savoir si le plugin peut afficher les résultats courants de la requête.
	 * Elle renvoie un booléen true/false
	 * Elle peut tester le tableau de résultat qui est dans "this.yasr.results"
	 * 
	 * Si le résultat de cette méthode est "false", l'onglet sera grisé
	 * @returns 
	 */
	public canHandleResults() {
    	return !!this.yasr.results && this.yasr.results.getVariables() && this.yasr.results.getVariables().length > 0;
  	}

	/**
	 * Cette méthode est appelée quand la query Sparnatural est passée au plugin d'affichage.
	 * Il faut garder la query dans une variable de classe pour y faire référence plus tard dans la méthode "draw"
	 * 
	 * @param sparnaturalQuery 
	 */
	public notifyQuery(sparnaturalQuery:ISparJson) {
		console.log("received query");
		console.log(sparnaturalQuery);
	}

	/**
	 * Cette méthode est appelée quand la configuration Sparnatural est passée au plugin d'affichage.
	 * Il faut garder la configuration dans une variable de classe pour y faire référence plus tard dans la méthode "draw"
	 * 
	 * @param specProvider 
	 */
	public notifyConfiguration(specProvider:any) {
		console.log("received specification provider from Sparnatural");
		console.log(specProvider);
	}
}