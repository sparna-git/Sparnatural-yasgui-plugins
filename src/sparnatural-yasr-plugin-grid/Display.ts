import { ResultBox } from "./Models/ResultBox";
import { Propertie } from "./Models/Propertie";
require("./index.scss");
require("./image-defaults/imageNone.jpg");
const im = require("../sparnatural-yasr-plugin-grid/image-defaults/imageNone.jpg");

export class DisplayBoxHtml {
  constructor() {}

  //methode pour afficher les resultats de toutes les encadrés
  public displayResultBoxes(
    startIndex: number = 0,
    resultBoxes: ResultBox[],
    resultsEl: HTMLElement
  ) {
    //affichage des resultats par bloc de 100 resultats
    const pageSize = 100;
    const endIndex = Math.min(startIndex + pageSize, resultBoxes.length);
    const gridContainer = document.createElement("div");
    gridContainer.className = "result-grid";
    //this.displayResultBoxesMerged(startIndex, resultBoxes, resultsEl);

    //parcourir le resultBoxes et creer un encadré pour chaque resultat
    //si le resultat contient une image, on affiche l'image
    //sinon on affiche le resultat sans image
    for (let i = startIndex; i < endIndex; i++) {
      //creer un encadré pour chaque resultat
      if (resultBoxes[i].docImageURI) {
        //with image
        const resultBox = this.createResultBox(resultBoxes[i]);
        gridContainer.appendChild(resultBox);
      } else {
        //without image
        const resultBox = this.createResultBoxWithoutImage(resultBoxes[i]);
        gridContainer.appendChild(resultBox);
      }
    }

    //tracer un trait entra les anciens et les nouveaux resultats
    if (startIndex === 0) {
      resultsEl.innerHTML = "";
      console.log("resultsEl cleared");
    } else {
      const separator = document.createElement("hr");
      separator.className = "result-separator";
      resultsEl.appendChild(separator);
      console.log("separator added");
    }
    resultsEl.appendChild(gridContainer);

    //ajouter le bouton load more a chaque fin de la page
    if (endIndex < resultBoxes.length) {
      this.addLoadMoreButton(endIndex, resultBoxes, resultsEl);
    } else {
      //ajout du message de fin des resultats et du bouton retour au debut et le nombre total de resultats
      const endMessage = document.createElement("div");
      endMessage.textContent = "Fin des résultats.";
      endMessage.classList.add("end-message");
      const resultNumber = document.createElement("div");
      resultNumber.textContent = `Nombre total de résultats obtenus : ${resultBoxes.length}/${resultBoxes.length}`;
      resultNumber.classList.add("result-number");
      const returnToTopButton = document.createElement("button");
      returnToTopButton.textContent = "Retour au début";
      returnToTopButton.classList.add("return-to-top-button");
      returnToTopButton.addEventListener("click", () => {
        window.scrollTo(0, 0);
      });
      //ajout des elements au DOM
      resultsEl.appendChild(endMessage);
      resultsEl.appendChild(resultNumber);
      resultsEl.appendChild(returnToTopButton);
    }
  }

  //-------------------------------------------------------------------
  //methode pour afficher les resultats de toutes les encadrés
  public displayResultBoxesMerged(
    startIndex: number = 0,
    resultBoxes: ResultBox[],
    resultsEl: HTMLElement
  ) {
    //affichage des resultats par bloc de 100 resultats
    let results = this.mergeResultBoxes(resultBoxes);
    const pageSize = 100;
    const endIndex = Math.min(startIndex + pageSize, results.length);
    const gridContainer = document.createElement("div");
    gridContainer.className = "result-grid";
    for (let i = startIndex; i < endIndex; i++) {
      for (const result in results) {
        gridContainer.appendChild(
          this.createResultBoxWithoutImage(results[result])
        );
      }
    }

    //tracer un trait entra les anciens et les nouveaux resultats
    if (startIndex === 0) {
      resultsEl.innerHTML = "";
      console.log("resultsEl cleared");
    } else {
      const separator = document.createElement("hr");
      separator.className = "result-separator";
      resultsEl.appendChild(separator);
      console.log("separator added");
    }
    resultsEl.appendChild(gridContainer);

    //ajouter le bouton load more a chaque fin de la page
    if (endIndex < results.length) {
      this.addLoadMoreButton(endIndex, resultBoxes, resultsEl);
    } else {
      //ajout du message de fin des resultats et du bouton retour au debut et le nombre total de resultats
      const endMessage = document.createElement("div");
      endMessage.textContent = "Fin des résultats.";
      endMessage.classList.add("end-message");
      const resultNumber = document.createElement("div");
      resultNumber.textContent = `Nombre total de résultats obtenus : ${results.length}/${results.length}`;
      resultNumber.classList.add("result-number");
      const returnToTopButton = document.createElement("button");
      returnToTopButton.textContent = "Retour au début";
      returnToTopButton.classList.add("return-to-top-button");
      returnToTopButton.addEventListener("click", () => {
        window.scrollTo(0, 0);
      });
      //ajout des elements au DOM
      resultsEl.appendChild(endMessage);
      resultsEl.appendChild(resultNumber);
      resultsEl.appendChild(returnToTopButton);
    }
  }
  //-------------------------------------------------------------------

  //methode pour ajouter le bouton load more
  private addLoadMoreButton(
    endIndex: number,
    resultBoxes: ResultBox[],
    resultsEl: HTMLElement
  ) {
    const loadMoreButton = document.createElement("button");
    loadMoreButton.textContent = "Load More";
    loadMoreButton.className = "load-more-button";
    loadMoreButton.addEventListener("click", () => {
      const startIndex = endIndex;
      this.displayResultBoxes(startIndex, resultBoxes, resultsEl);
      loadMoreButton.remove();
    });
    resultsEl.appendChild(loadMoreButton);
  }

  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //creer un encadré pour chaque resultat avec une image
  private createResultBox(resultBox: ResultBox): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box";

    //un div qui contient l'image et le type de document
    const containerImageType = document.createElement("div");
    containerImageType.className = "container-image-type";

    //un div qui contient le type de document
    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = "document-type-container";
    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = "document-type-label";
    documentTypeLabel.innerHTML = `${resultBox.docIcon}<strong>${resultBox.docType}</strong>`;
    documentTypeContainer.appendChild(documentTypeLabel);
    containerImageType.appendChild(documentTypeContainer);
    //div pour l'image
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    const photoElement = document.createElement("img");
    //si l'image n'est pas disponible, on affiche une image de secours
    photoElement.src = resultBox.docImageURI || im;
    photoElement.alt = "Image indisponible";

    // Ajout d'un gestionnaire d'erreurs pour charger l'image de secours si la première image échoue
    photoElement.onerror = function () {
      console.log("Image loading failed");
      this.onerror = null; // Évite une boucle d'erreurs si l'image de secours échoue également
      this.src = im;
    };

    imageContainer.appendChild(photoElement);
    containerImageType.appendChild(imageContainer);
    resultBoxElement.appendChild(containerImageType);

    //div pour le titre de l'encadré
    const titleElement = document.createElement("div");
    titleElement.className = "main-title";
    titleElement.innerHTML = `<strong>${this.limitTitleLength(
      resultBox.docTitle,
      50
    )}</strong>`;
    const key = document.createElement("div");
    key.className = "key";
    key.appendChild(titleElement);
    resultBoxElement.appendChild(key);

    resultBox.predicates.forEach((property) => {
      const keyValueElement = document.createElement("div");
      keyValueElement.className = "key-value-element";
      //differentes conditions pour afficher les proprietés
      if (property.value !== "" || property.children.length > 0) {
        if (property.value !== resultBox.docTitle) {
          if (property.uriValue !== "") {
            keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <a href="${property.uriValue}" target="_blank" class="popup-link" data-uri="${property.uriValue}"><strong>${property.value}</strong></a> <span class="objet">(${property.typeObject})</span>`;
            key.appendChild(keyValueElement);
            resultBoxElement.appendChild(key);
          } else {
            if (property.value !== "") {
              const value = property.value || "";
              keyValueElement.innerHTML = `<li/>${
                property.predicateAttribute
              } : ${this.limitTitleLength(value, 150)}`;
              key.appendChild(keyValueElement);
              resultBoxElement.appendChild(key);
            } else {
              if (property.children.length > 0) {
                keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <span class="objet">(${property.typeObject})</span>`;
                key.appendChild(keyValueElement);
                resultBoxElement.appendChild(key);
              }
            }
          }
        } else {
          if (property.children.length > 0) {
            keyValueElement.innerHTML = `<li/>${property.predicateAttribute} <span class="objet">(${property.typeObject})</span>`;
            key.appendChild(keyValueElement);
            resultBoxElement.appendChild(key);
          }
        }
      } /* else {
        if (property.value === "" && property.uriValue !== "")
          keyValueElement.innerHTML = `<li/>${property.predicateAttribute} <strong>${property.uriValue}</strong> (${property.typeObject})`;
      }*/
      if (property.children && property.children.length > 0) {
        property.children.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox
          );
          keyValueElement.appendChild(childElement);
          key.appendChild(keyValueElement);
          resultBoxElement.appendChild(key);
        });
      }
    });

    const consultButtonContainer = document.createElement("div");
    consultButtonContainer.className = "consult-button-container";
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.docTitleURI, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    resultBoxElement.appendChild(consultButtonContainer);
    /* 
    // Vérifier si tous les prédicats et leurs enfants ont une valeur ou une uriValue
    //let allPredicatesHaveValue = resultBox.predicates.every((property) => {
      //if (
        property.value === "" &&
        property.uriValue === "" &&
        property.children.length === 0
      ) {
        return false;
      }
      if (property.children.length > 0) {
        return property.children.every(
          (child) => child.value !== "" || child.uriValue !== ""
        );
      }
      return true;
    });

    // Appliquer la couleur de fond en fonction de la condition
    if (allPredicatesHaveValue) {
      resultBoxElement.style.backgroundColor = "#ffffcc"; //
    } else {
      resultBoxElement.style.backgroundColor = "#ffffff"; // blanc
    }
*/
    return resultBoxElement;
  }

  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------

  private createResultBoxFromProperty(
    property: Propertie,
    resultBox: any
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box-child";

    const keyValueElement = document.createElement("div");
    keyValueElement.className = "key-value-element-child";
    if (property.value !== "") {
      if (property.value !== resultBox.docTitle) {
        if (property.uriValue !== "") {
          keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <a href="${property.uriValue}" target="_blank" class="popup-link" data-uri="${property.uriValue}"><strong>${property.value}</strong></a> <span class="objet">(${property.typeObject})</span>`;
          resultBoxElement.appendChild(keyValueElement);
        } else {
          if (property.value !== "" && property.children.length > 0) {
            if (
              property.children.length > 0 &&
              property.children.find((child) => child.value !== "")
            ) {
              const value = property.value || ""; // Handle undefined value
              keyValueElement.innerHTML = `<li/>${
                property.predicateAttribute
              } : <strong>${this.limitTitleLength(
                value,
                150
              )} <span class="objet">(${property.typeObject})</span>`;
            } else {
              const value = property.value || ""; // Handle undefined value
              keyValueElement.innerHTML = "";
            }
          } else {
            if (property.children.find((child) => child.value !== "")) {
              const value = property.value || ""; // Handle undefined value
              keyValueElement.innerHTML = `<li/>${
                property.predicateAttribute
              } : <strong>${this.limitTitleLength(
                value,
                150
              )} <span class="objet">(${property.typeObject})</span>`;
            }
            if (property.uriValue === "") {
              keyValueElement.innerHTML = `<li/>${
                property.predicateAttribute
              } : ${this.limitTitleLength(property.value, 150)}`;
            }
          }
          resultBoxElement.appendChild(keyValueElement);
        }
      } else {
        if (
          property.children.length > 0 &&
          property.children.find((child) => child.value !== "")
        ) {
          keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <span class="objet">(${property.typeObject})</span>`;
          resultBoxElement.appendChild(keyValueElement);
        }
      }
    } else {
      if (
        property.children.length > 0 &&
        property.children.find((child) => child.value !== "")
      ) {
        keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <span class="objet">(${property.typeObject})</span>`;
        resultBoxElement.appendChild(keyValueElement);
      } else {
        keyValueElement.innerHTML = ``;
        resultBoxElement.appendChild(keyValueElement);
      }
    }

    if (property.children && property.children.length > 0) {
      const childrenContainer = document.createElement("div");
      childrenContainer.className = "children-container";
      property.children.forEach((child) => {
        const childElement = this.createResultBoxFromProperty(child, resultBox);
        keyValueElement.appendChild(childElement);
        resultBoxElement.appendChild(keyValueElement);
      });
    }

    return resultBoxElement;
  }

  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------

  private createResultBoxWithoutImage(resultBox: ResultBox): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box";

    const key = document.createElement("div");
    key.className = "key-wo-image";

    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = "document-type-container-wo-image";

    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = "document-type-label-wo-image";
    if (resultBox.docIcon) {
      documentTypeLabel.innerHTML = `${resultBox.docIcon}`;
    } else {
      documentTypeLabel.innerHTML = `${resultBox.docIcon}<strong>${resultBox.docType}</strong>`;
    }
    const titleElement = document.createElement("div");
    titleElement.className = "main-title-wo-image";
    titleElement.innerHTML = `<strong>${this.limitTitleLength(
      resultBox.docTitle,
      50
    )}</strong>`;

    documentTypeContainer.appendChild(documentTypeLabel);
    documentTypeContainer.appendChild(titleElement);
    key.appendChild(documentTypeContainer);
    resultBoxElement.appendChild(key);

    resultBox.predicates.forEach((property) => {
      const keyValueElement = document.createElement("div");
      keyValueElement.className = "key-value-element-wo-image";
      if (property.value !== "" || property.children.length > 0) {
        if (property.value !== resultBox.docTitle) {
          if (property.uriValue !== "") {
            keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <a href="${property.uriValue}" target="_blank" class="popup-link" data-uri="${property.uriValue}"><strong>${property.value}</strong></a> <span class="objet">(${property.typeObject})</span>`;
            key.appendChild(keyValueElement);
            resultBoxElement.appendChild(key);
          } else {
            if (property.value !== "") {
              const value = property.value || "";
              keyValueElement.innerHTML = `<li/>${
                property.predicateAttribute
              } : ${this.limitTitleLength(value, 150)}`;
              key.appendChild(keyValueElement);
              resultBoxElement.appendChild(key);
            } else {
              if (
                property.children.length > 0 &&
                property.children.find((child) => child.value !== "")
              ) {
                keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <span class="objet">(${property.typeObject})</span>ccc`;
                key.appendChild(keyValueElement);
                resultBoxElement.appendChild(key);
              }
            }
          }
        } else {
          if (
            property.children.length > 0 &&
            property.children.find((child) => child.value !== "")
          ) {
            keyValueElement.innerHTML = `<li/>${property.predicateAttribute} : <span class="objet">(${property.typeObject})</span>cc`;
            key.appendChild(keyValueElement);
            resultBoxElement.appendChild(key);
          }
        }
      }
      if (property.children && property.children.length > 0) {
        property.children.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox
          );
          keyValueElement.appendChild(childElement);
          key.appendChild(keyValueElement);
          resultBoxElement.appendChild(key);
        });
      }
    });

    const consultButtonContainer = document.createElement("div");
    consultButtonContainer.className = "consult-button-container";
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.docTitleURI, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    resultBoxElement.appendChild(consultButtonContainer);
    // Vérifier si tous les prédicats et leurs enfants ont une valeur
    //voir le cas aussi si le children n'est
    //faire sortir ca en methode parce que ca marche pas bien
    /*let allPredicatesHaveValue = this.allPredicatesHaveValue(resultBox);
    // Appliquer la couleur de fond en fonction de la condition
    if (allPredicatesHaveValue) {
      resultBoxElement.style.backgroundColor = "#ffffcc";
    } else {
      resultBoxElement.style.backgroundColor = "#ffffff"; // blanc
    }*/
    return resultBoxElement;
  }

  /* 
  private allPredicatesHaveValue(resultBox: ResultBox): boolean {
    let allPredicatesHaveValue = resultBox.predicates.every((property) => {
      if (property.value === "" && property.children.length === 0) {
        return false;
      }
      if (property.children.length > 0 && property.value === "") {
        return true;
      } else {
        return property.children.every((child) => child.value !== "");
      }
      //property.children.every((child) => child.value !== "")
      return true;
    });
    return allPredicatesHaveValue;
  }*/
  private allPredicatesHaveValue(resultBox: ResultBox): boolean {
    // Fonction récursive pour vérifier les valeurs des propriétés et de leurs enfants
    const checkPropertyValue = (property): boolean => {
      // Si la propriété a des enfants
      if (property.children.length > 0) {
        // Vérifier les valeurs des enfants récursivement
        const allChildrenHaveValue = property.children.every((child) =>
          checkPropertyValue(child)
        );
        // Si tous les enfants ont des valeurs mais pas le parent, retourner true
        if (allChildrenHaveValue && property.value === "") {
          return true;
        }
        // Si aucun enfant ni le parent n'ont de valeurs, retourner false
        if (!allChildrenHaveValue && property.value === "") {
          return false;
        }
        // Si tous les enfants ont des valeurs ou le parent a une valeur, retourner true
        return allChildrenHaveValue || property.value !== "";
      } else {
        // Si la propriété n'a pas d'enfants et n'a pas de valeur sélectionnée, retourner false
        return property.value !== "";
      }
    };

    // Vérifier chaque propriété dans resultBox
    return resultBox.predicates.every((property) =>
      checkPropertyValue(property)
    );
  }

  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------

  //changer le popup de la methode limitTitleLength
  private limitTitleLength(
    title: string | undefined,
    maxLength: number
  ): string {
    if ((title ?? "").length > maxLength) {
      const truncatedTitle = (title ?? "").slice(0, maxLength) + "(...)";
      const truncatedElement = `<span class="truncated-title" title="${title}">${truncatedTitle}</span>`;
      return truncatedElement;
    }
    return title ?? "";
  }

  //merger les resultats du meme objet principal
  private mergeResultBoxes(resultBoxes: ResultBox[]): ResultBox[] {
    const mergedResultBoxes: ResultBox[] = [];
    const titleToResultBox = new Map<string, ResultBox>();

    for (const resultBox of resultBoxes) {
      if (titleToResultBox.has(resultBox.docTitle)) {
        const existingResultBox = titleToResultBox.get(resultBox.docTitle)!;
        existingResultBox.predicates.push(...resultBox.predicates);
      } else {
        titleToResultBox.set(resultBox.docTitle, resultBox);
        mergedResultBoxes.push(resultBox);
      }
    }
    console.log("mergedResultBoxes", mergedResultBoxes);
    return mergedResultBoxes;
  }

  /*
  //merger les resultats qui ont le meme titre
  private mergeResultBoxes(resultBoxes: ResultBox[]): ResultBox[] {
    const mergedResultBoxes: ResultBox[] = [];
    const titleToResultBox = new Map<string, ResultBox>();

    for (const resultBox of resultBoxes) {
      if (titleToResultBox.has(resultBox.docTitle)) {
        const existingResultBox = titleToResultBox.get(resultBox.docTitle)!;
        existingResultBox.predicates.push(...resultBox.predicates);
      } else {
        titleToResultBox.set(resultBox.docTitle, resultBox);
        mergedResultBoxes.push(resultBox);
      }
    }

    return mergedResultBoxes;
  }
  
  */

  /*

  private createPopupElement(): HTMLElement {
    const popup = document.createElement("div");
    popup.className = "popup";
    popup.innerHTML = `
      <div class="popup-content">
        <img class="popup-image" src="" alt="Popup Image">
        <p class="popup-text"></p>
      </div>
    `;
    popup.style.display = "none";
    return popup;
  }
  
  private addPopupListeners() {
    document.addEventListener("mouseover", (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains("popup-link")) {
        const uri = target.getAttribute("data-uri");
        if (uri) {
          // Obtenez les coordonnées de la souris au moment du survol
          const mouseX = event.clientX;
          const mouseY = event.clientY;

          // Affichez la popup à côté de la souris
          this.showPopup(uri, mouseX, mouseY);
        }
      }
    });
  }

  private async fetchData(
    uri: string
  ): Promise<{ description: string; image?: string }> {
    const response = await fetch(uri);
    const html = await response.text();

    // Utilize regular expressions to extract the description and image source from the HTML
    const descriptionRegex = /<p class="lead">(.*?)<\/p>/;
    const imageSrcRegex =
      /<a[^>]+class="thumbnail"[^>]*>\s*<img[^>]+src="([^"]+)"/;

    const descriptionMatch = html.match(descriptionRegex);
    const imageSrcMatch = html.match(imageSrcRegex);

    const description = descriptionMatch
      ? descriptionMatch[1]
      : "No description available";
    const imageSrc = imageSrcMatch ? imageSrcMatch[1] : undefined;

    console.log("Description:", description);
    console.log("Image Source:", imageSrc);

    return { description, image: imageSrc };
  }
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------

  private async showPopup(uri: string, mouseX: number, mouseY: number) {
    const popup = document.querySelector(".popup") as HTMLElement;
    const popupImage = popup.querySelector(".popup-image") as HTMLImageElement;
    const popupText = popup.querySelector(".popup-text") as HTMLElement;

    // Fetcher les données (par exemple, depuis Wikidata)
    const data: { description: string; image?: string } = await this.fetchData(
      uri
    );

    popupImage.src = data.image || "";
    popupText.textContent = data.description || "Aucune description disponible";

    // Définir la position de la popup en fonction de la position de la souris
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const maxX = windowWidth - popupWidth;
    const maxY = windowHeight - popupHeight;

    // Ajuster la position en Y en prenant en compte le défilement de la page
    const adjustedY = mouseY + window.scrollY;
    popup.style.left = Math.min(mouseX, maxX) + "px";
    popup.style.top = Math.min(adjustedY, maxY) + "px";
    popup.style.display = "block";
  }
  */
}
