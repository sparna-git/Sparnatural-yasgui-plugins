namespace Parser {
  export interface ErrorSummary {
    status?: number;
    text: string;
    statusText?: string;
  }
  export interface BindingValue {
    value: string;
    // ***** TableX MODIFICATION
    // type: "uri" | "literal" | "typed-literal" | "bnode";
    type: "uri" | "literal" | "typed-literal" | "bnode" | "x-labelled-uri";
    // ***** end TableX MODIFICATION
    datatype?: string;
    "xml:lang"?: string;
    // ***** TableX MODIFICATION
    label?:string
    // ***** end TableX MODIFICATION
  }
  export interface Binding {
    [varname: string]: BindingValue;
  }
  export interface SparqlResults {
    head: {
      vars: string[];
    };
    boolean?: boolean;
    results?: {
      bindings: Binding[];
    };
  }
  //a json response summary, that we can store in localstorage
  export interface ResponseSummary {
    data?: any;
    error?: ErrorSummary;
    status?: number;
    contentType?: string;
    executionTime?: number;
  }
  export type PostProcessBinding = (binding: Binding) => Binding;
}

interface Parser {
  getBindings: any;
  getVariables: any;
  asCsv: any;
}

export default Parser;
