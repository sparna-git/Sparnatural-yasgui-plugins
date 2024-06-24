import Parser from "../parsers";
import { DataStats } from "./Models/DataStats";

export class ParseDataStats {
  constructor() {}

  //cette methode recupere les bindings et identifie les colonnes label et data
  private identifyColumns(bindings: Parser.Binding[]): {
    data: string;
    label: string;
  } {
    //column for our dataStats
    let dataColumn: string = "";
    let labelColumn: string = "";

    //loop through the bindings to identify the columns
    for (let bindingSet of bindings) {
      for (const key in bindingSet) {
        //check if the column is a label or data
        if (!bindingSet[key]?.label) {
          //the key is the column name
          dataColumn = key;
        } else {
          //the key is the column name
          labelColumn = key;
        }
      }
    }
    //return the identified columns 'couple of label and data columns'
    return { data: dataColumn, label: labelColumn };
  }

  //cette methode recupere les bindings et les mise selon une structure de données label,value using DataStats
  public extractdata(Binding: Parser.Binding[]): DataStats[] {
    // Add your logic here to process the binding and return a value of type DataStats[]
    //declare an array of DataStats
    let dataStats: DataStats[] = [];
    //idenitification des column
    const { data, label } = this.identifyColumns(Binding);

    // Loop through the bindings
    for (const bindingSet of Binding) {
      // Create a new DataStats object
      const newDataStat = new DataStats(
        bindingSet[label]?.label || "",
        parseInt(bindingSet[data].value)
      );
      // Add the DataStats object to the array
      dataStats.push(newDataStat);
    }
    console.log("DataStats :", dataStats);
    return dataStats;
  }

  // cette methode recupere les dataStats et retourne les 19 premiers elements (maxValues on dataStats) et additionne les autres sous la propriété "Others"
  public extractOnlyDataNeeded(
    dataStats: DataStats[],
    quantity: number
  ): DataStats[] {
    //declare an array of DataStats
    let topDataStats: DataStats[] = [];
    //sort the dataStats by value
    //cela permet de recuperer les (quantity) premiers elements les plus grands
    dataStats.sort((a, b) => b.value - a.value);
    //une fois le array est trié, on recupere les 19 premiers elements
    //get the top (quantity) elements
    topDataStats = dataStats.slice(0, quantity);
    //ce qui reste des elements sera additionner sous la propriété "Others"
    //sum the rest of the elements
    let othersCount = dataStats.slice(quantity).reduce((sum, dataStat) => {
      return sum + dataStat.value;
    }, 0);
    //add the "Others" entry if more than quantity entries
    if (dataStats.length > quantity) {
      topDataStats.push(new DataStats("Others", othersCount));
    }
    //att the end we get the topDataStats "quantity elements"
    return topDataStats;
  }
}
