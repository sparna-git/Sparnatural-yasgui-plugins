import Chart from "chart.js/auto";
import Parser from "../parsers";
require("./indexs.scss");
import { ParseDataStats } from "./ParseDataStats";

export class DisplayStats {
  private parseDataStats = new ParseDataStats();

  private currentChartType: string = "pie";
  private number: number = 20;

  constructor() {}

  //this methode displayStats permet d'afficher les statistiques
  public displayStats(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    //si le nombre de bindings est égale à 1 on affiche le nombre active 'displayNumber'
    if (bindings.length === 1) {
      this.displayNumber(bindings, resultsEl);
    } else {
      //sinon on affiche les charts selon le choix de l'utilisateur
      this.displayCharts(bindings, resultsEl, this.currentChartType);
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

    //creation du contenu html pour le chart
    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);

    resultsEl.appendChild(container);
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

    const contain = document.createElement("div");
    contain.classList.add("contain");
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("chart-dropdown-quantity");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);
    let button = document.createElement("select");
    button.classList.add("chart-dropdown-type");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);
    container.appendChild(contain);
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

    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);

    resultsEl.appendChild(container);

    new Chart(canvas, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false,
            position: "right",
            labels: {
              boxWidth: 20,
              padding: 10,
            },
          },
          title: {
            display: false,
            text: "Bar Chart",
            position: "top",
            align: "center",
          },
        },
      },
    });

    const contain = document.createElement("div");
    contain.classList.add("contain");
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("chart-dropdown-quantity");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);
    let button = document.createElement("select");
    button.classList.add("chart-dropdown-type");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);
    container.appendChild(contain);
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

    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);

    resultsEl.appendChild(container);

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

    const contain = document.createElement("div");
    contain.classList.add("contain");
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("chart-dropdown-quantity");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);
    let button = document.createElement("select");
    button.classList.add("chart-dropdown-type");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);
    container.appendChild(contain);
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

    const container = document.createElement("div");
    container.classList.add("pie-chart-container");

    const canvas = document.createElement("canvas");
    canvas.classList.add("chart-pie");
    container.appendChild(canvas);

    resultsEl.appendChild(container);

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

    const contain = document.createElement("div");
    contain.classList.add("contain");
    const textquantity = document.createElement("p");
    textquantity.textContent = "Quantity to display :";
    contain.appendChild(textquantity);
    let buttonQuantity = document.createElement("select");
    buttonQuantity.classList.add("chart-dropdown-quantity");
    buttonQuantity = this.chosenQuantity(bindings, resultsEl);
    contain.appendChild(buttonQuantity);
    let button = document.createElement("select");
    button.classList.add("chart-dropdown-type");
    button = this.displayDropdownList(bindings, resultsEl);
    contain.appendChild(button);
    container.appendChild(contain);
  }

  public displayNumber(bindings: Parser.Binding[], resultsEl: HTMLElement) {
    resultsEl.innerHTML = ""; // Effacer le contenu précédent

    const container = document.createElement("div");
    container.classList.add("result-container-pie");

    const box = document.createElement("div");
    box.classList.add("result-box-pie");

    const valueDiv = document.createElement("div");
    valueDiv.classList.add("result-value-pie");

    for (let bindingSet of bindings) {
      for (const key in bindingSet) {
        valueDiv.textContent = bindingSet[key].value;
      }
    }
    box.appendChild(valueDiv);
    container.appendChild(box);
    resultsEl.appendChild(container);
  }
}
