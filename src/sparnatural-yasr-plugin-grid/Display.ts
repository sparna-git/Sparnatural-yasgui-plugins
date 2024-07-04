import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
require("./index.scss");
const im = require("./image-defaults/imageNone.jpg");

export class DisplayBoxHtml {
  constructor() {}

  // Methode pour afficher les resultats de toutes les encadrés
  public displayResultBoxes(
    startIndex: number = 0,
    resultBoxes: ResultBoxM[],
    resultsEl: HTMLElement,
    translations: any
  ) {
    // Affichage du nombre total de résultats obtenus
    if (startIndex === 0) {
      resultsEl.innerHTML = "";
      const resultCount = document.createElement("div");
      resultCount.className = "result-count";
      resultCount.textContent = `${resultBoxes.length} ${translations["ObjectsInResult"]}`;
      resultsEl.appendChild(resultCount);
    }

    // Affichage des resultats par bloc de 100 resultats
    const pageSize = 100;
    const endIndex = Math.min(startIndex + pageSize, resultBoxes.length);
    const gridContainer = document.createElement("div");
    gridContainer.className = "result-grid";

    // Parcourir le resultBoxes et créer un encadré pour chaque résultat
    for (let i = startIndex; i < endIndex; i++) {
      const resultBox = resultBoxes[i].image
        ? this.createResultBoxWithImage(resultBoxes[i], translations)
        : this.createResultBoxWithoutImage(resultBoxes[i], translations);
      gridContainer.appendChild(resultBox);
    }

    // Tracer un trait entre les anciens et les nouveaux résultats
    if (startIndex !== 0) {
      const separator = document.createElement("hr");
      separator.className = "result-separator";
      resultsEl.appendChild(separator);
      console.log("separator added");
    }

    resultsEl.appendChild(gridContainer);

    // Ajouter le bouton "load more" à chaque fin de la page
    if (endIndex < resultBoxes.length) {
      this.addLoadMoreButton(endIndex, resultBoxes, resultsEl, translations);
    } else {
      // Ajout du message de fin des résultats et du bouton retour au début
      const endMessage = document.createElement("div");
      endMessage.textContent = `${translations["EndResults"]}`;
      endMessage.classList.add("end-message");

      const returnToTopButton = document.createElement("button");
      returnToTopButton.textContent = `${translations["BackToTop"]}`;
      returnToTopButton.classList.add("return-to-top-button");
      returnToTopButton.addEventListener("click", () => {
        window.scrollTo(0, 0);
      });

      // Ajout des éléments au DOM
      resultsEl.appendChild(endMessage);
      resultsEl.appendChild(returnToTopButton);
    }

    this.initializeClickEvents();
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
      console.log("charger les resultats suivants");
      loadMoreButton.remove();
    });
    resultsEl.appendChild(loadMoreButton);
  }

  //methode qui gere l'affichage des encadrés avec image
  //cette methode permet de creer un encadré pour chaque resultat qui contient une image
  //PS : travailler sur les conditions pour afficher les resultats sans probleme et sans doublon "gerer tout les cas possibles"
  private createResultBoxWithImage(
    resultBox: ResultBoxM,
    translations: any
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box";

    // Un div qui contient l'image et le type de document
    const containerImageType = document.createElement("div");
    containerImageType.className = "container-image-type";

    // Un div qui contient le type de document (icône + label)
    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = "document-type-container";
    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = "document-type-label";
    documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}<strong>${resultBox.typeResultBox.label}</strong>`;
    documentTypeContainer.appendChild(documentTypeLabel);
    //ajouter le type de document au container general
    containerImageType.appendChild(documentTypeContainer);

    // Div pour l'image
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    const photoElement = document.createElement("img");

    photoElement.src = resultBox.image || im;
    photoElement.alt = "Image indisponible";

    // Ajout d'un gestionnaire d'erreurs pour charger l'image de secours si la première image échoue
    photoElement.onerror = function () {
      console.log("Image loading failed");
      this.onerror = null; // Évite une boucle d'erreurs si l'image de secours échoue également
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
    imageContainer.appendChild(consultButtonContainer); // Ajout du bouton au conteneur d'image

    // Ajouter l'image au conteneur général
    containerImageType.appendChild(imageContainer);
    resultBoxElement.appendChild(containerImageType);

    // Div pour le titre de l'encadré
    const titleElement = document.createElement("div");
    titleElement.className = "main-title";
    titleElement.innerHTML = `<strong>${this.limitTitleLength(
      resultBox.title,
      50
    )}</strong>`;
    const key = document.createElement("div");
    key.className = "key";
    key.appendChild(titleElement);
    resultBoxElement.appendChild(key);

    // Div pour les propriétés de l'encadré (scrollable)
    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "scrollable-container";
    //PS : travailler sur les conditions pour afficher les resultats sans problemes et sans doublons
    resultBox.predicates.forEach((property) => {
      let keyValueElementCreated = false;

      property.values.forEach((value) => {
        if (value.label !== "") {
          if (value.predicates.length > 0) {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";

            if (value.label !== resultBox.title) {
              if (value.uri !== "") {
                keyValueElement.innerHTML = `<li/>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span>`;
              } else if (value.label !== "") {
                const val = value.label || "";
                keyValueElement.innerHTML = `<li/>${
                  property.label
                } : ${this.limitLength(val, 150, translations)}`;
              } else if (value.predicates.length > 0) {
                keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
              }
            } else if (value.predicates.length > 0) {
              keyValueElement.innerHTML = `<li/>${property.label} <span class="objet">(${property.valueType.label})</span>`;
            }

            if (value.predicates && value.predicates.length > 0) {
              value.predicates.forEach((child) => {
                const childElement = this.createResultBoxFromProperty(
                  child,
                  resultBox,
                  translations
                );
                keyValueElement.appendChild(childElement);
              });
            }
            scrollableContainer.appendChild(keyValueElement);
            keyValueElementCreated = true;
          }
        } else {
          if (value.label === "" && value.predicates.length > 0) {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";

            if (value.label !== resultBox.title) {
              if (value.uri !== "") {
                keyValueElement.innerHTML = `<li/>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span>`;
              } else if (value.label !== "") {
                const val = value.label || "";
                keyValueElement.innerHTML = `<li/>${
                  property.label
                } : ${this.limitLength(val, 150, translations)}`;
              } else if (
                value.predicates.length > 0 &&
                value.predicates.find((predicate) =>
                  predicate.values.find((value) => value.label !== "")
                )
              ) {
                keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
              }
            } else if (value.predicates.length > 0) {
              keyValueElement.innerHTML = `<li/>${property.label} <span class="objet">(${property.valueType.label})</span>`;
            }

            if (value.predicates && value.predicates.length > 0) {
              value.predicates.forEach((child) => {
                const childElement = this.createResultBoxFromProperty(
                  child,
                  resultBox,
                  translations
                );
                keyValueElement.appendChild(childElement);
              });
            }
            scrollableContainer.appendChild(keyValueElement);
            keyValueElementCreated = true;
          }
        }
      });

      if (!keyValueElementCreated && property.values.length > 0) {
        const valuesList = property.values
          .map((value) => {
            if (value.uri && value.id) {
              return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
            } else {
              return `${this.limitLength(
                value.label || "",
                150,
                translations
              )}`;
            }
          })
          .join(", ");
        const keyValueElement = document.createElement("div");
        keyValueElement.className = "key-value-element";
        for (let i = 0; i < property.values.length; i++) {
          if (
            property.values[i].uri !== "" &&
            property.values[i].label !== ""
          ) {
            keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
          } else {
            if (property.values[i].label !== "") {
              keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList}`;
              console.log("yo");
            }
          }
          scrollableContainer.appendChild(keyValueElement);
        }
      }

      key.appendChild(scrollableContainer);
    });

    resultBoxElement.appendChild(key);
    return resultBoxElement;
  }

  //methode qui gere l'affichage des enfants des resultats
  // recursive function
  // PS : travailler sur les conditions pour afficher les resultats sans probleme et sans doublon "gerer tout les cas possibles"
  private createResultBoxFromProperty(
    property: Property,
    resultBox: ResultBoxM,
    translations: any
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box-child";

    const keyValueElement = document.createElement("div");
    keyValueElement.className = "key-value-element-child";

    /*  // Fonction utilitaire pour filtrer les doublons
    const uniqueValues = (values) => {
      const seen = new Set();
      return values.filter((value) => {
        const duplicate = seen.has(value.label);
        seen.add(value.label);
        return !duplicate;
      });
    };*/

    // Fonction utilitaire pour filtrer les doublons
    const uniqueValues = (values) => {
      const seen = new Set();
      return values.filter((value) => {
        const duplicate = seen.has(value.id);
        seen.add(value.id);
        return !duplicate;
      });
    };

    // Filtrer les valeurs en doublon
    const filteredValues = uniqueValues(property.values);

    // Mapping des valeurs
    const valuesList = filteredValues
      .map((value) => {
        if (value.uri && value.label) {
          return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
        } else {
          return `${this.limitLength(value.label || "", 150, translations)}`;
        }
      })
      .join(", ");

    // Conditions spécifiques
    let valueAppended = false;
    for (let i = 0; i < filteredValues.length; i++) {
      const value = filteredValues[i];
      if (value.label !== resultBox.title) {
        if (value.uri !== "" && value.label !== "") {
          keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
          resultBoxElement.appendChild(keyValueElement);
          valueAppended = true;
          break;
        } else if (value.label !== "") {
          keyValueElement.innerHTML = `<li/>${
            property.label
          } : ${this.limitLength(value.label, 150, translations)}`;
          resultBoxElement.appendChild(keyValueElement);
          valueAppended = true;
          break;
        } else if (
          value.predicates.find((predicate) =>
            predicate.values.find((value) => value.label !== "")
          )
        ) {
          keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
          resultBoxElement.appendChild(keyValueElement);
          valueAppended = true;
          break;
        } else if (!this.isImageURI(value.uri)) {
          keyValueElement.innerHTML = `<li/>${property.label} : ${value.uri} <span class="objet">(${property.valueType.label})</span>`;
          resultBoxElement.appendChild(keyValueElement);
          valueAppended = true;
          break;
        }
      }
    }

    //filter les valeurs a chaque fois qu'il y a un doublon
    if (!valueAppended && filteredValues.find((value) => value.id !== "")) {
      keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
      resultBoxElement.appendChild(keyValueElement);
    } else if (!valueAppended) {
      keyValueElement.innerHTML = ``;
      resultBoxElement.appendChild(keyValueElement);
    }

    // Ajout des children si existent
    filteredValues.forEach((value) => {
      if (value.predicates && value.predicates.length > 0) {
        value.predicates.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox,
            translations
          );
          keyValueElement.appendChild(childElement);
        });
      }
    });

    return resultBoxElement;
  }

  //cette methode permet de verifier si l'uri est une image
  //avec une expression reguliere "all urls that containing words as '.jpg, .jpeg, .png, .svg ' we can add more extensions if needed"
  private isImageURI(uri: string): boolean {
    //we can add more extensions if needed just add  '|.extension'
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }

  //methode qui est charger de creer un encadré pour chaque resultat sans image
  //PS : travailler sur les condition pour afficher les resultats sans probleme et sans doublon
  private createResultBoxWithoutImage(
    resultBox: ResultBoxM,
    translations: any
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box";

    const key = document.createElement("div");
    key.className = "key-wo-image";

    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = "document-type-container-wo-image";

    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = "document-type-label-wo-image";
    if (resultBox.typeResultBox.icon) {
      documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}`;
    } else {
      documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}<strong>${resultBox.typeResultBox.label}</strong>`;
    }
    const titleElement = document.createElement("div");
    titleElement.className = "main-title-wo-image";
    titleElement.innerHTML = `<a href="${
      resultBox.uri
    }" target="_blank"><strong>${this.limitTitleLength(
      resultBox.title,
      50
    )}</strong></a>`;

    documentTypeContainer.appendChild(documentTypeLabel);
    documentTypeContainer.appendChild(titleElement);
    key.appendChild(documentTypeContainer);
    resultBoxElement.appendChild(key);
    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "scrollable-container-wo-image";
    resultBox.predicates.forEach((property) => {
      let keyValueElementCreated = false;

      property.values.forEach((value) => {
        if (value.label !== "") {
          if (value.predicates.length > 0) {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";

            if (value.label !== resultBox.title) {
              if (value.uri !== "") {
                keyValueElement.innerHTML = `<li/>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span>`;
              } else if (value.label !== "") {
                const val = value.label || "";
                keyValueElement.innerHTML = `<li/>${
                  property.label
                } : ${this.limitLength(val, 150, translations)}`;
              } else if (value.predicates.length > 0) {
                keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
              }
            } else if (value.predicates.length > 0) {
              keyValueElement.innerHTML = `<li/>${property.label} <span class="objet">(${property.valueType.label})</span>`;
            }

            if (value.predicates && value.predicates.length > 0) {
              value.predicates.forEach((child) => {
                const childElement = this.createResultBoxFromProperty(
                  child,
                  resultBox,
                  translations
                );
                keyValueElement.appendChild(childElement);
              });
            }
            scrollableContainer.appendChild(keyValueElement);
            keyValueElementCreated = true;
          }
        } else {
          if (value.label === "" && value.predicates.length > 0) {
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";

            if (value.label !== resultBox.title) {
              if (value.uri !== "") {
                keyValueElement.innerHTML = `<li/>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span>`;
              } else if (value.label !== "") {
                const val = value.label || "";
                keyValueElement.innerHTML = `<li/>${
                  property.label
                } : ${this.limitLength(val, 150, translations)}`;
              } else if (
                value.predicates.length > 0 &&
                value.predicates.find((predicate) =>
                  predicate.values.find((value) => value.label !== "")
                )
              ) {
                keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
              }
            } else if (value.predicates.length > 0) {
              keyValueElement.innerHTML = `<li/>${property.label} <span class="objet">(${property.valueType.label})</span>`;
            }

            if (value.predicates && value.predicates.length > 0) {
              value.predicates.forEach((child) => {
                const childElement = this.createResultBoxFromProperty(
                  child,
                  resultBox,
                  translations
                );
                keyValueElement.appendChild(childElement);
              });
            }
            scrollableContainer.appendChild(keyValueElement);
            keyValueElementCreated = true;
          }
        }
      });

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
          .join(", ");
        const keyValueElement = document.createElement("div");
        keyValueElement.className = "key-value-element";
        for (let i = 0; i < property.values.length; i++) {
          if (
            property.values[i].uri !== "" &&
            property.values[i].label !== ""
          ) {
            keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
          } else {
            if (property.values[i].label !== "") {
              keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList}`;
              console.log("yo");
            }
          }
          scrollableContainer.appendChild(keyValueElement);
        }
      }

      key.appendChild(scrollableContainer);
    });
    resultBoxElement.appendChild(key);
    return resultBoxElement;
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
      const truncatedElement = `<span class="truncated-title" title="${title}">${truncatedTitle}</span>`;
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
}
