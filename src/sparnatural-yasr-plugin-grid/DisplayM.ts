import { ResultBoxM } from "./Models/ResultBox";
import { Property } from "./Models/Property";
import { PropertyValue } from "./Models/PropertyValue";
import { ResultBoxType } from "./Models/ResultBoxType";
import { result } from "lodash-es";
require("./index.scss");
const im = require("./image-defaults/imageNone.jpg");

export class DisplayBoxHtmlM {
  constructor() {}

  //methode pour afficher les resultats de toutes les encadrés
  public displayResultBoxes(
    startIndex: number = 0,
    resultBoxes: ResultBoxM[],
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
      if (resultBoxes[i].image) {
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
    this.initializeClickEvents();
  }

  //-------------------------------------------------------------------

  //methode pour ajouter le bouton load more
  private addLoadMoreButton(
    endIndex: number,
    resultBoxes: ResultBoxM[],
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
  /*
  //creer un encadré pour chaque resultat avec une image
  private createResultBox(resultBox: ResultBoxM): HTMLDivElement {
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
    documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}<strong>${resultBox.typeResultBox.label}</strong>`;
    documentTypeContainer.appendChild(documentTypeLabel);
    containerImageType.appendChild(documentTypeContainer);

    //div pour l'image
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
    containerImageType.appendChild(imageContainer);
    resultBoxElement.appendChild(containerImageType);

    //div pour le titre de l'encadré
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
    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "scrollable-container";
    resultBox.predicates.forEach((property) => {
      property.values.forEach((value) => {
        if (value.label !== "" && value.predicates.length > 0) {
          const keyValueElement = document.createElement("div");
          keyValueElement.className = "key-value-element";

          if (value.label !== resultBox.title) {
            if (value.uri !== "") {
              keyValueElement.innerHTML = `<li/>${property.label} : <a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a> <span class="objet">(${property.valueType.label})</span>`;
            } else if (value.label !== "") {
              const val = value.label || "";
              keyValueElement.innerHTML = `<li/>${
                property.label
              } : ${this.limitLength(val, 150)}`;
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
                resultBox
              );
              keyValueElement.appendChild(childElement);
            });
          }
          scrollableContainer.appendChild(keyValueElement);
        } else {
          if (value.label !== "" && value.predicates.length === 0) {
            const valuesList = property.values
              .map((value) => {
                if (value.uri) {
                  return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
                } else {
                  return `${this.limitLength(value.label || "", 150)}`;
                }
              })
              .join(", ");
            const keyValueElement = document.createElement("div");
            keyValueElement.className = "key-value-element";
            if (property.values[0].uri !== "") {
              keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
              scrollableContainer.appendChild(keyValueElement);
            } else {
              keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList}`;
              scrollableContainer.appendChild(keyValueElement);
            }
          }
        }
      });

      key.appendChild(scrollableContainer);
    });

    resultBoxElement.appendChild(key);
    const consultButtonContainer = document.createElement("div");
    consultButtonContainer.className = "consult-button-container";
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.uri, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    resultBoxElement.appendChild(consultButtonContainer);

    return resultBoxElement;
  }
*/
  //creer un encadré pour chaque resultat avec une image
  private createResultBox(resultBox: ResultBoxM): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box";

    // Un div qui contient l'image et le type de document
    const containerImageType = document.createElement("div");
    containerImageType.className = "container-image-type";

    // Un div qui contient le type de document
    const documentTypeContainer = document.createElement("div");
    documentTypeContainer.className = "document-type-container";
    const documentTypeLabel = document.createElement("div");
    documentTypeLabel.className = "document-type-label";
    documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}<strong>${resultBox.typeResultBox.label}</strong>`;
    documentTypeContainer.appendChild(documentTypeLabel);
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
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.uri, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    imageContainer.appendChild(consultButtonContainer); // Ajout du bouton au conteneur d'image

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

    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "scrollable-container";
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
              return `${this.limitLength(value.label || "", 150)}`;
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

  /*  private createResultBox(resultBox: ResultBoxM): HTMLDivElement {
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
    documentTypeLabel.innerHTML = `${resultBox.typeResultBox.icon}<strong>${resultBox.typeResultBox.label}</strong>`;
    documentTypeContainer.appendChild(documentTypeLabel);
    containerImageType.appendChild(documentTypeContainer);

    //div pour l'image
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
    containerImageType.appendChild(imageContainer);
    resultBoxElement.appendChild(containerImageType);

    //div pour le titre de l'encadré
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
    const scrollableContainer = document.createElement("div");
    scrollableContainer.className = "scrollable-container";
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
              return `${this.limitLength(value.label || "", 150)}`;
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
    const consultButtonContainer = document.createElement("div");
    consultButtonContainer.className = "consult-button-container";
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.uri, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    resultBoxElement.appendChild(consultButtonContainer);

    return resultBoxElement;
  }
*/
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  //-------------------------------------------------------------------
  private createResultBoxFromProperty(
    property: Property,
    resultBox: ResultBoxM
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
          return `${this.limitLength(value.label || "", 150)}`;
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
          } : ${this.limitLength(value.label, 150)}`;
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
    /*
    if (!valueAppended && filteredValues.find((value) => value.label !== "")) {
      keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
      resultBoxElement.appendChild(keyValueElement);
    } else if (!valueAppended) {
      keyValueElement.innerHTML = ``;
      resultBoxElement.appendChild(keyValueElement);
    }*/
    if (!valueAppended && filteredValues.find((value) => value.id !== "")) {
      keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
      resultBoxElement.appendChild(keyValueElement);
    } else if (!valueAppended) {
      keyValueElement.innerHTML = ``;
      resultBoxElement.appendChild(keyValueElement);
    }

    // Ajout des predicates
    filteredValues.forEach((value) => {
      if (value.predicates && value.predicates.length > 0) {
        value.predicates.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox
          );
          keyValueElement.appendChild(childElement);
        });
      }
    });

    return resultBoxElement;
  }
  /**/
  /*
  private createResultBoxFromProperty(
    property: Property,
    resultBox: ResultBoxM
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box-child";

    const keyValueElement = document.createElement("div");
    keyValueElement.className = "key-value-element-child";

    // Mapping des valeurs
    const valuesList = property.values
      .map((value) => {
        if (value.uri && value.label) {
          return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
        } else {
          return `${this.limitLength(value.label || "", 150)}`;
        }
      })
      .join(", ");

    // Conditions spécifiques
    let valueAppended = false;
    for (let i = 0; i < property.values.length; i++) {
      const value = property.values[i];
      if (value.label !== resultBox.title) {
        if (value.uri !== "" && value.label !== "") {
          keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
          resultBoxElement.appendChild(keyValueElement);
          valueAppended = true;
          break;
        } else if (value.label !== "") {
          keyValueElement.innerHTML = `<li/>${
            property.label
          } : ${this.limitLength(value.label, 150)}`;
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
    /*
    if (
            value.predicates.find((predicate) =>
              predicate.values.find((value) => value.label !== "")
            )
          ) {
    
    if (!valueAppended && property.values.find((value) => value.label !== "")) {
      keyValueElement.innerHTML = `<li/>${property.label} : <span class="objet">(${property.valueType.label})</span>`;
      resultBoxElement.appendChild(keyValueElement);
    } else if (!valueAppended) {
      keyValueElement.innerHTML = ``;
      resultBoxElement.appendChild(keyValueElement);
    }

    // Ajout des predicates
    property.values.forEach((value) => {
      if (value.predicates && value.predicates.length > 0) {
        value.predicates.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox
          );
          keyValueElement.appendChild(childElement);
        });
      }
    });

    return resultBoxElement;
  }*/
  private isImageURI(uri: string): boolean {
    return uri.match(/\.(jpg|jpeg|png|svg)(\?.*)?$/i) !== null;
  }
  /*
  private createResultBoxFromProperty(
    property: Property,
    resultBox: any
  ): HTMLDivElement {
    const resultBoxElement = document.createElement("div");
    resultBoxElement.className = "result-box-child";

    const keyValueElement = document.createElement("div");
    keyValueElement.className = "key-value-element-child";

    const valuesList = property.values
      .map((value) => {
        if (value.uri && value.label) {
          return `<a href="${value.uri}" target="_blank" class="popup-link" data-uri="${value.uri}"><strong>${value.label}</strong></a>`;
        } else {
          return `${this.limitLength(value.label || "", 150)}`;
        }
      })
      .join(", ");

    if (property.values[0].uri !== "") {
      keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList} <span class="objet">(${property.valueType.label})</span>`;
      resultBoxElement.appendChild(keyValueElement);
    } else {
      keyValueElement.innerHTML = `<li/>${property.label} : ${valuesList}`;
      resultBoxElement.appendChild(keyValueElement);
    }

    property.values.forEach((value) => {
      if (value.predicates && value.predicates.length > 0) {
        value.predicates.forEach((child) => {
          const childElement = this.createResultBoxFromProperty(
            child,
            resultBox
          );
          keyValueElement.appendChild(childElement);
        });
      }
    });

    return resultBoxElement;
  }
  */
  private createResultBoxWithoutImage(resultBox: ResultBoxM): HTMLDivElement {
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
                } : ${this.limitLength(val, 150)}`;
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
                  resultBox
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
              return `${this.limitLength(value.label || "", 150)}`;
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
    /*
    const consultButtonContainer = document.createElement("div");
    consultButtonContainer.className = "consult-button-container";
    const consultButton = document.createElement("button");
    consultButton.textContent = "Consulter";
    consultButton.addEventListener("click", () => {
      window.open(resultBox.uri, "_blank");
    });
    consultButtonContainer.appendChild(consultButton);
    resultBoxElement.appendChild(consultButtonContainer);
*/
    return resultBoxElement;
  }

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

  private limitLength(text: string | undefined, maxLength: number): string {
    if ((text ?? "").length > maxLength) {
      const truncatedTitle = (text ?? "").slice(0, maxLength);
      const remainingTitle = (text ?? "").slice(maxLength);
      const truncatedElement = `
            <span class="truncated-title" title="${text}">
                ${truncatedTitle}<a class="show-more">lire la suite</a><span class="remaining-title" style="display: none;">${remainingTitle}</span>
            </span>`;
      return truncatedElement;
    }
    return text ?? "";
  }

  public initializeClickEvents() {
    document.addEventListener("click", function (event) {
      const target = event.target as HTMLElement;
      if (target && target.classList.contains("show-more")) {
        const remainingTextElement = target.nextElementSibling as HTMLElement;
        if (remainingTextElement) {
          remainingTextElement.style.display = "inline";
          target.style.display = "none";
        }
      }
    });
  }
}
