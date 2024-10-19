import type { ContentScriptContext } from "wxt/client";
import "~/assets/tailwind.css";

// Light DOM -> The main DOM of the website that is loaded.
// Shadow DOM -> The DOM of the extension being developed.

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    const ui = await createUi(ctx);
    ui.mount();
  },
});

function createUi(ctx: ContentScriptContext) {
  // Creating a shadow UI to seperate the injected UI from the main UI.
  return createShadowRootUi(ctx, {
    name: "tailwind-shadow-root-linkedin-extension",
    position: "inline",
    anchor: "body",
    append: "first",

    onMount: (uiContainer) => {
      let modalOverlay = document.querySelector(
        ".modal-overlay"
      ) as HTMLElement;
      let modal = document.querySelector(".ai-modal");
      let activeMessageBox: HTMLElement | null = null;

      const staticResponse =
        "Thank you for the opportunity! If you have any more questions or if there's anything else I can help you with, feel free to ask.";

      // Since AI icon is injected in the light DOM, it is styled traditionally.
      const createAiIcon = () => {
        const aiIcon = document.createElement("div");
        aiIcon.style.position = "absolute";
        aiIcon.style.bottom = "0";
        aiIcon.style.right = "10px";
        aiIcon.style.cursor = "pointer";

        const aiIconUrl = chrome.runtime.getURL("icon/ai_icon.png");
        aiIcon.innerHTML = `<img style="width: 30px;" src=${aiIconUrl} alt="Ai input field icon"/>`;
        return aiIcon;
      };

      const generateIconUrl = chrome.runtime.getURL("icon/generate_icon.png");
      const insertIconUrl = chrome.runtime.getURL("icon/insert_icon.png");
      const regenerateIconUrl = chrome.runtime.getURL(
        "icon/regenerate_icon.png"
      );

      // Handling the message of each message box unit corresponding to their respective users.
      const handleMessageBox = (messageInputDiv: HTMLElement) => {
        const aiIcon = createAiIcon();
        // Attcahing the AI icon to the light DOM.
        messageInputDiv.appendChild(aiIcon);

        let inputText = messageInputDiv.querySelector("p");

        // Function that contains the observer for the input text. Whenever the input field content is all delete the aiIcon gets removed along with
        // since it is also a child of it so we track that state to reset the aiIcon.
        const observeInputText = (pElement: HTMLElement | null) => {
          if (!pElement) return;

          const inputLengthObeserver = new MutationObserver(() => {
            if (pElement && pElement.textContent?.length === 0) {
              if (!messageInputDiv.contains(aiIcon)) {
                messageInputDiv.appendChild(aiIcon);
                const newInputText = messageInputDiv.querySelector("p");
                observeInputText(newInputText);
              }
            }
          });
          if (pElement) {
            inputLengthObeserver.observe(pElement, {
              childList: true,
              characterData: true,
              subtree: true,
            });
          }
        };
        observeInputText(inputText);

        // To detect any change to the light DOM's input div.
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.target instanceof HTMLElement &&
              mutation.target.classList.contains("msg-form__contenteditable")
            ) {
              const isFocused = mutation.target.getAttribute(
                "data-artdeco-is-focused"
              );
              if (isFocused === "true") {
                aiIcon.style.visibility = "visible";
                activeMessageBox = messageInputDiv;
                if (!messageInputDiv.contains(aiIcon)) {
                  messageInputDiv.appendChild(aiIcon);
                }
              } else {
                aiIcon.style.visibility = "hidden";
              }
            }
          });
        });

        observer.observe(messageInputDiv, {
          attributes: true,
          attributeFilter: ["data-artdeco-is-focused"],
        });

        aiIcon.addEventListener("click", () => {
          if (!modalOverlay) {
            modalOverlay = document.createElement("div");
            modalOverlay.className =
              "modal-overlay fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-[50]";
            modalOverlay.style.display = "none";

            modal = document.createElement("div");
            modal.className =
              "ai-modal bg-white rounded-2xl shadow-lg p-6 w-1/3 max-w-full max-h-full relative z-[50]";

            // TailwindCSS styled modal 1
            modal.innerHTML = `
              <div class="w-full" >
                <input class="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 prompt-input" placeholder="Your prompt" type="text" />
                <div class="flex justify-end">
                  <button class="w-48 font-semibold mt-5 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 right-0 generate-button flex items-center justify-around">
                    <img class="w-6 h-6" src=${generateIconUrl} alt="Generate Button Icon"/>
                    Generate
                  </button>
                </div>
                
              </div>
            `;

            modalOverlay.appendChild(modal);
            // Attaching the modals to the shadow DOM.
            uiContainer.append(modalOverlay);
          }
          modalOverlay.style.display = "flex";

          modalOverlay.addEventListener("click", (event) => {
            if (event.target === modalOverlay) {
              modalOverlay.style.display = "none";
              resetModal();
            }
          });

          const generateButton = modal?.querySelector(".generate-button");
          generateButton?.addEventListener("click", () => {
            const promptInput = modal?.querySelector(
              ".prompt-input"
            ) as HTMLInputElement;
            const input = promptInput?.value;

            if (modal) {
              // TailwindCSS styled modal 2
              modal.innerHTML = `
              <div>
                <div class="flex justify-end ">
                  <div class="bg-gray-100 p-3 rounded-xl text-gray-500 max-w-2xl">
                    ${input}
                  </div>
                </div>
                <div class="mt-7 ">
                  <div class="bg-blue-100 p-3 rounded-xl text-gray-500 max-w-2xl">
                    ${staticResponse}
                  </div>
                </div>
                <input class="mt-7 w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 prompt-input" placeholder="Your prompt" type="text" />
                <div class="flex justify-end space-x-4 items-center">
                  <button class="w-36 border rounded-lg border-black font-semibold mt-5 text-gray-500 px-4 py-2 rounded-md hover:bg-indigo-700 right-0 insert-prompt-button flex items-center justify-around">
                    <img class="w-4 h-5" src=${insertIconUrl} alt="Insert Button Icon"/>
                    Insert
                  </button>
                  <button class="w-52 font-semibold mt-5 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 right-0 regenerate-button flex items-center justify-around">
                    <img class="w-5 h-6" src=${regenerateIconUrl} alt="Regenerate Button Icon"/>
                    Regenerate
                  </button>
                </div>
              </div>
            `;
            }

            modalOverlay.addEventListener("click", (event) => {
              if (event.target === modalOverlay) {
                modalOverlay.style.display = "none";
                resetModal();
              }
            });

            const insertPromptButton = modal?.querySelector(
              ".insert-prompt-button"
            );

            insertPromptButton?.addEventListener("click", () => {
              if (activeMessageBox) {
                const targetTextLocation = activeMessageBox.querySelector(
                  "p"
                ) as HTMLParagraphElement;
                if (targetTextLocation) {
                  targetTextLocation.textContent = staticResponse;
                  const event = new Event("input", { bubbles: true });
                  targetTextLocation.dispatchEvent(event);
                  targetTextLocation.focus();
                  modalOverlay.style.display = "none";
                  resetModal();
                } else {
                  console.error("Target paragraph element not found");
                }
              }
            });
          });
        });
      };

      const resetModal = () => {
        if (modal) {
          modal.innerHTML = `
            <div class="w-full" >
              <input class="w-full p-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 prompt-input" placeholder="Your prompt" type="text" />
              <div class="flex justify-end">
                <button class="w-48 font-semibold mt-5 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 right-0 generate-button flex items-center justify-around">
                  <img class="w-6 h-6" src=${generateIconUrl} alt="Generate Button Icon"/>
                  Generate
                </button>
              </div>
              
            </div>
          `;
        }
      };

      // To observe the changes to the light DOM elements.
      const globalObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) {
              if (node.classList.contains("msg-form__contenteditable")) {
                handleMessageBox(node);
              }
            }
          });
        });
      });

      const observerElement = document.querySelector(".render-mode-BIGPIPE");
      if (observerElement) {
        globalObserver.observe(observerElement, {
          subtree: true,
          attributes: true,
          childList: true,
        });
      } else {
        console.error("Observer element not found");
      }
    },
  });
}
