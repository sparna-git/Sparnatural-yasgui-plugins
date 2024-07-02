import Chart from "chart.js/auto";
import Parser from "../parsers";
import "./indexs.scss";
import { ParseDataStats } from "./ParseDataStats";

export class DisplayStats {
  private parseDataStats = new ParseDataStats();

  private currentChartType: string = "pie";
  private number: number = 20;

  constructor() {}

  // Méthode displayStats permet d'afficher les statistiques
  public displayStats(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    // Vérification si le nombre de clés dans bindingset est égal à 1
    if (Object.keys(bindings[0]).length === 1 || bindings.length === 1) {
      this.displayNumber(bindings, resultsEl);
    } else {
      if (bindings.length !== 1) {
        // Sinon, on affiche les charts selon le choix de l'utilisateur
        this.displayCharts(bindings, resultsEl, this.currentChartType);
      }
    }
  }

  //methode displaycharts qui propose un switch avec les methode displayPie et displayBar et displayDoughnut et display Polar
  public displayCharts(
    bindings: Parser.Binding[],
    resultsEl: HTMLElement,
    chartType: string
  ) {
    switch (chartType) {
      case "pie":
        this.displayPie(bindings, resultsEl);
        break;
      case "bar":
        this.displayBar(bindings, resultsEl);
        break;
      case "doughnut":
        this.displayDoughnut(bindings, resultsEl);
        break;
      case "polar":
        this.displayPolar(bindings, resultsEl);
        break;
    }
  }

  //methode displayDropdownList qui permet d'afficher un dropdown list pour choisir le type de chart
  public displayDropdownList(
    bindings: Parser.Binding[],
    resultsEl: HTMLElement
  ): HTMLSelectElement {
    const dropdownList = document.createElement("select");
    dropdownList.classList.add("chart-dropdown");

    // Options for the dropdown
    const options = [
      { value: "pie", text: "Pie Chart" },
      { value: "bar", text: "Bar Chart" },
      { value: "doughnut", text: "Doughnut Chart" },
      { value: "polar", text: "Polar Chart" },
    ];

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      dropdownList.appendChild(optionElement);
    });

    // Event listener for change
    dropdownList.addEventListener("change", () => {
      this.currentChartType = dropdownList.value;
      this.displayCharts(bindings, resultsEl, this.currentChartType);
    });

    // Set initial selected option
    dropdownList.value = this.currentChartType;

    resultsEl.appendChild(dropdownList);
    return dropdownList;
  }

  //methode generateColors qui permet de generer des couleurs pour les charts
  private generateColors(count: number): string[] {
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.floor((360 / count) * i);
      colors.push(`hsl(${hue}, 70%, 50%)`);
    }
    return colors;
  }

  //methode qui permet de choisir la quantité des elements à afficher propose 4 valeur 5 10 20 40
  public chosenQuantity(
    bindings: Parser.Binding[],
    resultsEl: HTMLElement
  ): HTMLSelectElement {
    const dropdownList = document.createElement("select");
    dropdownList.classList.add("chart-dropdown");

    // Options for the dropdown
    const options = [
      { value: "5", text: "5" },
      { value: "10", text: "10" },
      { value: "20", text: "20" },
      { value: "25", text: "25" },
    ];

    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      dropdownList.appendChild(optionElement);
    });

    // Event listener for change
    dropdownList.addEventListener("change", () => {
      //convert the value to number
      this.number = parseInt(dropdownList.value);
      this.displayCharts(bindings, resultsEl, this.currentChartType);
    });

    // Set initial selected option
    dropdownList.value = this.number.toString();

    resultsEl.appendChild(dropdownList);
    return dropdownList;
  }

  //methode displayPie qui permet d'afficher un pie chart
  public displayPie(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    let labels: string[] = [];
    let data: number[] = [];

    //recuperer les données avec l'utilisation de la methode extractdata de la classe ParseDataStats
    const parsedData = this.parseDataStats.extractdata(bindings);
    //recuperer les valeur selon la quantité demandée par l'utilisateur
    const dataF = this.parseDataStats.extractOnlyDataNeeded(
      parsedData,
      this.number
    );

    console.log("DataF :", dataF);
    //recuperer les labels et les valeurs
    for (const bindingSet of dataF) {
      //cela nous permet d'etre plus sur de la valeur de label et de value pour chaque bindingSet
      labels.push(bindingSet.label ?? "");
      // a changer de mettre value as 0 si value est null !!!
      data.push(bindingSet.value) ?? 0;
    }
    //generer les couleurs pour le chart selon la longueur des données
    const backgroundColors = this.generateColors(data.length);
    //les données du chart labels et dataSets
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          hoverOffset: 8,
        },
      ],
    };

    // Effacer le contenu précédent
    resultsEl.innerHTML = "";

    const containerCentre = document.createElement("div");
    containerCentre.classList.add("chart-center");
    //creation du contenu html pour le chart
    const container = document.createElement("div");
    container.classList.add("pie-chart-container");
    const contain = document.createElement("div");
    contain.classList.add("contain");

    // Create and append the "Quantity to display :" text
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);

    // Create and append the quantity dropdown
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("cc");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);

    // Create and append the chart type dropdown
    let button = document.createElement("select");
    button.classList.add("chart-dropdown");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);

    // Append the container to the main container
    container.appendChild(contain);

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);
    containerCentre.appendChild(container);
    resultsEl.appendChild(containerCentre);
    //creation du chart
    new Chart(canvas, {
      type: "pie",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 20,
              padding: 10,
            },
          },
          title: {
            display: false,
            text: "Pie Chart",
            position: "top",
            align: "center",
          },
        },
      },
    });
  }

  //same methods of pie chart we will change only the type of chart type:'Bar'
  public displayBar(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    let labels: string[] = [];
    let data: number[] = [];

    const parsedData = this.parseDataStats.extractdata(bindings);
    const dataF = this.parseDataStats.extractOnlyDataNeeded(
      parsedData,
      this.number
    );
    console.log("DataF :", dataF);
    for (const bindingSet of dataF) {
      labels.push(bindingSet.label ?? "");
      data.push(bindingSet.value) ?? 0;
    }
    const backgroundColors = this.generateColors(data.length);
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          hoverOffset: 8,
        },
      ],
    };

    resultsEl.innerHTML = ""; // Effacer le contenu précédent

    const containerCentre = document.createElement("div");
    containerCentre.classList.add("chart-center");

    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const contain = document.createElement("div");
    contain.classList.add("contain");

    // Create and append the "Quantity to display :" text
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);

    // Create and append the quantity dropdown
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("cc");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);

    // Create and append the chart type dropdown
    let button = document.createElement("select");
    button.classList.add("chart-dropdown");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);

    // Append the container to the main container
    container.appendChild(contain);

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);
    containerCentre.appendChild(container);
    resultsEl.appendChild(containerCentre);

    new Chart(canvas, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          title: {
            display: false,
            text: "Bar Chart",
            position: "top",
            align: "center",
          },
        },
      },
    });
  }

  public displayDoughnut(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    let labels: string[] = [];
    let data: number[] = [];

    const parsedData = this.parseDataStats.extractdata(bindings);
    const dataF = this.parseDataStats.extractOnlyDataNeeded(
      parsedData,
      this.number
    );
    console.log("DataF :", dataF);
    for (const bindingSet of dataF) {
      labels.push(bindingSet.label ?? "");
      data.push(bindingSet.value) ?? 0;
    }
    const backgroundColors = this.generateColors(data.length);
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          hoverOffset: 8,
        },
      ],
    };

    resultsEl.innerHTML = ""; // Effacer le contenu précédent
    const containerCentre = document.createElement("div");
    containerCentre.classList.add("chart-center");
    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const contain = document.createElement("div");
    contain.classList.add("contain");

    // Create and append the "Quantity to display :" text
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);

    // Create and append the quantity dropdown
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("cc");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);

    // Create and append the chart type dropdown
    let button = document.createElement("select");
    button.classList.add("chart-dropdown");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);

    // Append the container to the main container
    container.appendChild(contain);

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);
    containerCentre.appendChild(container);
    resultsEl.appendChild(containerCentre);

    new Chart(canvas, {
      type: "doughnut",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 20,
              padding: 10,
            },
          },
          title: {
            display: false,
            text: "Doughnut Chart",
            position: "top",
            align: "center",
          },
        },
      },
    });
  }

  public displayPolar(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    let labels: string[] = [];
    let data: number[] = [];

    const parsedData = this.parseDataStats.extractdata(bindings);
    const dataF = this.parseDataStats.extractOnlyDataNeeded(
      parsedData,
      this.number
    );
    console.log("DataF :", dataF);
    for (const bindingSet of dataF) {
      labels.push(bindingSet.label ?? "");
      data.push(bindingSet.value) ?? 0;
    }
    const backgroundColors = this.generateColors(data.length);
    const chartData = {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 1,
          hoverOffset: 8,
        },
      ],
    };

    resultsEl.innerHTML = ""; // Effacer le contenu précédent
    const containerCentre = document.createElement("div");
    containerCentre.classList.add("chart-center");
    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const contain = document.createElement("div");
    contain.classList.add("contain");

    // Create and append the "Quantity to display :" text
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);

    // Create and append the quantity dropdown
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("cc");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);

    // Create and append the chart type dropdown
    let button = document.createElement("select");
    button.classList.add("chart-dropdown");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);

    // Append the container to the main container
    container.appendChild(contain);

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);
    containerCentre.appendChild(container);
    resultsEl.appendChild(containerCentre);

    new Chart(canvas, {
      type: "polarArea",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "right",
            labels: {
              boxWidth: 20,
              padding: 10,
            },
          },
          title: {
            display: false,
            text: "Polar Chart",
            position: "top",
            align: "center",
          },
        },
      },
    });
  }

  public displayNumber(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    resultsEl.innerHTML = ""; // Effacer le contenu précédent

    //column for our dataStats
    let dataColumn: string = "";
    let labelColumn: string = "";

    //loop through the bindings to identify the columns
    for (let bindingSet of bindings) {
      for (const key in bindingSet) {
        //check if the column is a label or data
        if (!bindingSet[key]?.label) {
          //the key is the column name
          console.log("key :", key);
          dataColumn = key;
        } else {
          //the key is the column name
          console.log("key :", key);
          labelColumn = key;
        }
      }
    }

    const container = document.createElement("div");
    container.classList.add("result-container-pie");

    const box = document.createElement("div");
    box.classList.add("result-box-pie");

    const valueDiv = document.createElement("div");
    valueDiv.classList.add("result-value-pie");

    for (let bindingSet of bindings) {
      for (const key in bindingSet) {
        valueDiv.textContent = bindingSet[dataColumn].value;
      }
    }
    box.appendChild(valueDiv);
    container.appendChild(box);
    resultsEl.appendChild(container);
  }
}
