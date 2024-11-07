import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
require("./indexGrid.scss");
const im = require("./image-defaults/imageNone.jpg");

export class DisplayBoxHtmlNew {
  constructor() {}

  // Méthode optimisée pour créer un encadré, avec ou sans image, et afficher les propriétés
  private createResultBox(
    resultBox: ResultBoxM,
    translations: any,
    withImage: boolean = false
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    if (!withImage) {
      resultBoxElement.className = "result-box-wo-i";
    } else {
      resultBoxElement.className = "result-box";
    }

    // Un div qui contient le type de document et éventuellement l'image
    const containerType = document.createElement("div");
    containerType.className = withImage
      ? "container-image-type"
      : "key-wo-image";

    // Création du label de type de document
    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = withImage
      ? "document-type-container"
      : "document-type-container-wo-image";
    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = withImage
      ? "document-type-label"
      : "document-type-label-wo-image";

    // Construire le HTML de l'icône
    let iconHtml = resultBox.typeResultBox.icon
      ? resultBox.typeResultBox.icon.startsWith("<")
        ? resultBox.typeResultBox.icon
        : `<i style="font-size:180%" class="${resultBox.typeResultBox.icon}"></i>`
      : `<strong>${resultBox.typeResultBox.label}</strong>`;
    if (withImage) {
      documentTypeLabel.innerHTML = `<span class="icon-i">${iconHtml}</span> <strong>${resultBox.typeResultBox.label}</strong>`;
    } else {
      documentTypeLabel.innerHTML = `<strong>${iconHtml}</strong>`;
    }
    documentTypeContainer.appendChild(documentTypeLabel);
    containerType.appendChild(documentTypeContainer);

    // Si avec image, ajouter l'image et le bouton "Consulter"
    if (withImage) {
      const imageContainer = document.createElement("div");
      imageContainer.className = "image-container";
      const photoElement = document.createElement("img");
      photoElement.src = resultBox.image || im;
      photoElement.alt = "Image indisponible";
      photoElement.onerror = function () {
        this.onerror = null;
        this.src = im;
      };
      imageContainer.appendChild(photoElement);

      // Ajouter le bouton "Consulter" ici
      const consultButtonContainer = document.createElement("div");
      consultButtonContainer.className = "consult-button-container";
      const consultButton = document.createElement("button");
      consultButton.textContent = `${translations["Consult"]}`;
      consultButton.addEventListener("click", () => {
        window.open(resultBox.uri, "_blank");
      });
      consultButtonContainer.appendChild(consultButton);
      imageContainer.appendChild(consultButtonContainer);

      containerType.appendChild(imageContainer);
    }

    // Ajouter le conteneur de type (et image si nécessaire) à l'encadré principal
    resultBoxElement.appendChild(containerType);

    // Div pour le titre
    const titleElement = document.createElement("div");
    titleElement.className = withImage ? "main-title" : "main-title-wo-image";
    if (!withImage) {
      titleElement.innerHTML = `<a href="${
        resultBox.uri
      }" target="_blank"><strong>${this.limitTitleLength(
        resultBox.title,
        50
      )}</strong></a>`;
    } else {
      titleElement.innerHTML = `<strong>${this.limitTitleLength(
        resultBox.title,
        50
      )}</strong>`;
    }
    const Key = document.createElement("div");
    Key.className = "key";
    //si l'encadres n'a pas d'image on fait ca
    if (!withImage) {
      documentTypeContainer.appendChild(titleElement);
      containerType.appendChild(documentTypeContainer);
      //resultBoxElement.appendChild(titleElement);
    } else {
      Key.appendChild(titleElement);
      resultBoxElement.appendChild(Key);
    }

    // Div pour les propriétés (scrollable)
    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = withImage
      ? "scrollable-container"
      : "scrollable-container-wo-image";
    this.addPropertiesToContainer(resultBox, scrollableContainer, translations);
    if (!withImage) {
      resultBoxElement.appendChild(scrollableContainer);
    } else {
      Key.appendChild(scrollableContainer);
      resultBoxElement.appendChild(Key);
    }
    return resultBoxElement;
  }

  // Méthode pour ajouter les propriétés à un conteneur avec la logique modifiée (récursive)
  private addPropertiesToContainer(
    resultBox: ResultBoxM,
    container: HTMLDivElement,
    translations: any
  ) {
    resultBox.predicates.forEach((property) => {
      let keyValueElementCreated = false;

      // Pour chaque valeur, on applique la logique de traitement
      property.values.forEach((value) => {
        const keyValueElement = document.createElement("div");
        keyValueElement.className = "key-value-element";

        // Si la valeur a un label et des enfants (prédicats)
        if (value.label !== "") {
          if (value.predicates.length > 0) {
            if (value.label !== resultBox.title) {
              if (value.uri !== "") {
                keyValueElement.innerHTML = `<li>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span></li>`;
              } else {
                keyValueElement.innerHTML = `<li>${
                  property.label
                } : ${this.limitLength(value.label, 150, translations)}</li>`;
              }
            } else {
              keyValueElement.innerHTML = `<li>${property.label} <span class="objet">(${property.valueType.label})</span></li>`;
            }

            // Ajouter les enfants récursivement
            const childContainer = document.createElement("div");
            childContainer.className = "child-container";
            this.addPropertiesToContainer(
              { predicates: value.predicates } as ResultBoxM,
              childContainer,
              translations
            );
            keyValueElement.appendChild(childContainer);
            keyValueElementCreated = true;
          }
        } else if (value.label === "" && value.predicates.length > 0) {
          // Si le label est vide mais qu'il y a des prédicats
          //et si les children ont des valeurs on les affiche sinon on affiche juste le label
          if (value.predicates.find((v) => v.values.length > 0)) {
            keyValueElement.innerHTML = `<li>${property.label} :</li>`;
          }
          // Ajouter les enfants récursivement
          const childContainer = document.createElement("div");
          childContainer.className = "child-container";
          this.addPropertiesToContainer(
            { predicates: value.predicates } as ResultBoxM,
            childContainer,
            translations
          );
          keyValueElement.appendChild(childContainer);
          keyValueElementCreated = true;
        }

        // Ajouter l'élément si une valeur a été traitée
        if (keyValueElementCreated) {
          container.appendChild(keyValueElement);
        }
      });

      // Si aucun élément clé-valeur n'a été créé et que des valeurs existent, afficher une liste
      if (!keyValueElementCreated && property.values.length > 0) {
        const valuesList = property.values
          .map((value) => {
            if (value.uri && value.label) {
              return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
            } else {
              return `${this.limitLength(
                value.label || "",
                150,
                translations
              )}`;
            }
          })
          .join("<strong> ;</strong> ");
        // ajouter une condition pour afficher le property.valueType.label que pour les valeurs qui ont un uri et un label
        //sinon on affiche juste `<li>${property.label} : ${valuesList}</li>`
        if (valuesList) {
          if (property.values.find((v) => v.uri !== "" && v.label !== "")) {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";
            //console.log("Yo", valuesList);
            keyValueElement.innerHTML = `<li>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span></li>`;
            container.appendChild(keyValueElement);
          } else {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";
            keyValueElement.innerHTML = `<li>${property.label} : ${valuesList}</li>`;
            container.appendChild(keyValueElement);
          }
        }
      }
    });
  }

  // Méthode publique pour afficher les encadrés, en utilisant createResultBox
  public displayResultBoxes(
    startIndex: number = 0,
    resultBoxes: ResultBoxM[],
    resultsEl: HTMLElement,
    translations: any
  ) {
    if (startIndex === 0) {
      resultsEl.innerHTML = "";
      const resultCount = document.createElement("div");
      resultCount.className = "result-count";
      resultCount.textContent = `${resultBoxes.length} ${translations["ObjectsInResult"]}`;
      resultsEl.appendChild(resultCount);
    }

    const pageSize = 100;
    const endIndex = Math.min(startIndex + pageSize, resultBoxes.length);
    const gridContainer = document.createElement("div");
    //si l'image est presente on affiche le grid-container sinon on affiche le grid-container sans image
    for (let i = 0; i < resultBoxes.length; i++) {
      if (resultBoxes[i].image) {
        console.log("image");
        gridContainer.className = "result-grid";
      } else {
        console.log("pas d'image");
        gridContainer.className = "result-grid-wo-i";
      }
    }
    for (let i = startIndex; i < endIndex; i++) {
      const resultBox = resultBoxes[i];
      const withImage = Boolean(resultBox.image);
      const boxElement = this.createResultBox(
        resultBox,
        translations,
        withImage
      );
      gridContainer.appendChild(boxElement);
    }

    if (startIndex !== 0) {
      const separator = document.createElement("hr");
      separator.className = "result-separator";
      resultsEl.appendChild(separator);
    }

    resultsEl.appendChild(gridContainer);

    if (endIndex < resultBoxes.length) {
      this.addLoadMoreButton(endIndex, resultBoxes, resultsEl, translations);
    } else {
      const endMessage = document.createElement("div");
      endMessage.textContent = translations["EndResults"];
      endMessage.classList.add("end-message");

      const returnToTopButton = document.createElement("button");
      returnToTopButton.textContent = translations["BackToTop"];
      returnToTopButton.classList.add("return-to-top-button");
      returnToTopButton.addEventListener("click", () => window.scrollTo(0, 0));

      resultsEl.appendChild(endMessage);
      resultsEl.appendChild(returnToTopButton);
    }

    this.initializeClickEvents();
  }

  //cette methode permet de limiter la longueur du titre de l'encadré
  //si le titre est superieur à 50 caractères, on affiche les 50 premiers caractères
  //avec l'option de popup pour afficher le titre complet si on passe la souris sur le titre
  private limitTitleLength(
    title: string | undefined,
    maxLength: number
  ): string {
    if ((title ?? "").length > maxLength) {
      const truncatedTitle = (title ?? "").slice(0, maxLength) + "(...)";
      const truncatedElement = `<span class="truncated-title" title="${title}" style="color:black;">${truncatedTitle}</span>`;
      return truncatedElement;
    }
    return title ?? "";
  }

  // cette methode permet de limiter la longueur du texte
  // si on clique sur "lire la suite", on affiche le texte complet
  //cette methode permet de laisser l'encadré lisible et de ne pas surcharger l'interface
  private limitLength(
    text: string | undefined,
    maxLength: number,
    translations: any
  ): string {
    if ((text ?? "").length > maxLength) {
      const truncatedTitle = (text ?? "").slice(0, maxLength);
      const remainingTitle = (text ?? "").slice(maxLength);
      const truncatedElement = `
            <span class="" title="${text}">
                ${truncatedTitle}<a class="show-more">${translations["more"]}</a><span class="remaining-title" style="display: none;">${remainingTitle}</span>
            </span>`;
      return truncatedElement;
    }
    return `<span class="property-text">${text ?? ""}</span>`;
  }

  //cette methode permet d'initialiser les evenements click
  //prend la class "show-more" et affiche le texte complet
  //eventListener
  public initializeClickEvents() {
    const showMoreElements = document.querySelectorAll(".show-more");
    showMoreElements.forEach((element) => {
      element.addEventListener("click", function (event) {
        const target = event.target as HTMLElement;
        const remainingTextElement = target.nextElementSibling as HTMLElement;
        if (remainingTextElement) {
          remainingTextElement.style.display = "inline";
          target.style.display = "none";
        }
      });
    });
  }
  // Methode pour ajouter le bouton load more
  private addLoadMoreButton(
    endIndex: number,
    resultBoxes: ResultBoxM[],
    resultsEl: HTMLElement,
    translations: any
  ) {
    const loadMoreButton = document.createElement("button");
    loadMoreButton.textContent = `${translations["LoadMore"]}`;
    loadMoreButton.className = "load-more-button";
    loadMoreButton.addEventListener("click", () => {
      const startIndex = endIndex;
      this.displayResultBoxes(startIndex, resultBoxes, resultsEl, translations);
      loadMoreButton.remove();
    });
    resultsEl.appendChild(loadMoreButton);
  }
}
