/*
  This file shows how to integrate SparNatural into your website. 
*/

$( document ).ready(function($) {

  const sparnatural = document.querySelector("spar-natural");

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const lang = urlParams.get('lang')

  sparnatural.addEventListener("init", (event) => {  
    // notify the specification to yasr plugins
    for (const plugin in yasr.plugins) {
        if(yasr.plugins[plugin].notifyConfiguration) {
            yasr.plugins[plugin].notifyConfiguration(sparnatural.sparnatural.specProvider);
        }
    }
  });


  sparnatural.addEventListener("queryUpdated", (event) => {
    var queryString = sparnatural.expandSparql(event.detail.queryString);
    yasqe.setValue(queryString);
    // store JSON in hidden field
    document.getElementById('query-json').value = JSON.stringify(event.detail.queryJson);

    // notify the query to yasr plugins
    for (const plugin in yasr.plugins) {
        if(yasr.plugins[plugin].notifyQuery) {
            yasr.plugins[plugin].notifyQuery(event.detail.queryJson);
        }
    }
  });

  sparnatural.addEventListener("submit", (event) => {
    sparnatural.disablePlayBtn();
    // trigger the query from YasQE
    yasqe.query();
  });

  console.log("init yasr & yasqe...");
  const yasqe = new Yasqe(document.getElementById("yasqe"), {
      requestConfig: { endpoint: $('#endpoint').text() },
      copyEndpointOnNewTab: false  
  });


  Yasr.registerPlugin("TableX",SparnaturalYasguiPlugins.TableX);
  Yasr.registerPlugin("Map",SparnaturalYasguiPlugins.MapPlugin);
  Yasr.registerPlugin("MyTestPlugin",SparnaturalYasguiPlugins.MyTestPlugin);

  delete Yasr.plugins['table'];
  const yasr = new Yasr(document.getElementById("yasr"), {
      pluginOrder: ["TableX", "Response", "Map", "MyTestPlugin"],
      defaultPlugin: "TableX",
      //this way, the URLs in the results are prettified using the defined prefixes in the query
      getUsedPrefixes : yasqe.getPrefixesFromQuery,
      "drawOutputSelector": false,
      "drawDownloadIcon": false,
      // avoid persistency side-effects
      "persistency": { "prefix": false, "results": { "key": false }}
  });

  // link yasqe and yasr
  yasqe.on("queryResponse", function(_yasqe, response, duration) {
      yasr.setResponse(response, duration);
      sparnatural.enablePlayBtn() ;
  }); 

});