import Parser from "./parsers";


/**
 * extends the standard SPARQL query results by merging xxxx and xxxx_label columns
 * into a single column structure containing the URI and the label to be displayed
 */
export class TableXResults implements Parser {
    private bindings: Parser.Binding[];
    private variables: string[];

    constructor(parser: Parser, bindingSetAdapter?:((bindingSet:Parser.Binding) => Parser.Binding)) {
      this.bindings = parser.getBindings();
      // process complete binding sets
      if(bindingSetAdapter) {
        this.bindings = this.bindings.map((bindingSet) => bindingSetAdapter(bindingSet));
      }
      // add new bindings with labels + uris
      this.bindings = this.bindings.map((bindingSet) => this.enhanceBinding(bindingSet));
      // remove _label from list of variables
      this.variables = parser.getVariables().filter((variable) =>
            !(
                variable.endsWith("_label")
                &&
                parser.getVariables().includes(variable.substring(0, variable.length-("_label".length)))
            )
        );
    }
  
    public getBindings() {
      return this.bindings;
    }
  
    public getVariables() {
        return this.variables;
    }
  
    public asCsv() {
        return null;
    }
  
    private enhanceBinding(bindingSet: Parser.Binding) : Parser.Binding {
        var newBinding = {};
        for (var key in bindingSet) {
            // if we find the same key woth _label in the binding set
        // if(key+"_label" in bindingSet) {
        if(bindingSet[key+"_label"] != undefined) {
          // then recreate a special binding in the binding set with the URI and the label
                var label = bindingSet[key+"_label"].value;
                newBinding[key] = {
                    value: bindingSet[key].value,
                    type: "x-labelled-uri",
                    datatype: bindingSet[key].datatype,
                    "xml:lang": bindingSet[key]["xml:lang"],
                    label: label
                }
            } else if(
          // if the key ends with xxx_label and the key xxx exists in the binding set, then ignore it
                key.endsWith("_label")
                &&
                key.substring(0, key.length-("_label".length)) in bindingSet
            ) {
                // don't include it in bindings
            } else {
          // otherwise just include as normal
                newBinding[key] = bindingSet[key];
            }
        }
        return newBinding;
    }
  }