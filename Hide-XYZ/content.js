"use strict"

const blurFilter = "blur(6px)"
let textToBlur = ""

// Search this DOM node for text to blur and blur the parent element if found.
function processNode(node) {
    if (node.childNodes.length > 0) {
        Array.from(node.childNodes).forEach(processNode);
    }
    if (
        node.nodeType === Node.TEXT_NODE &&
        node.textContent !== null &&
        node.textContent.trim().length > 0
    ) {
        const parent = node.parentElement;
        if (
            parent !== null &&
            (parent.tagName === "SCRIPT" || parent.style.filter === blurFilter)
        ) {
            // Already blurred
            return;
        }
        if (node.textContent.includes(textToBlur)) {
            const index = node.textContent.indexOf(textToBlur);
            const textBefore = node.textContent.substring(0, index);
            const textAfter = node.textContent.substring(index + textToBlur.length);

            // Create a new span element
            const newNode = document.createElement("span");
            newNode.textContent = textToBlur;
            newNode.style.filter = blurFilter;

            // Replace the original text node with the new span element
            const fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(textBefore));
            fragment.appendChild(newNode);
            fragment.appendChild(document.createTextNode(textAfter));
            parent.replaceChild(fragment, node);
        }
    }
}

function blurElement(elem) {
    elem.style.filter = blurFilter
    console.debug("blurred id:" + elem.id + " class:" + elem.className +
        " tag:" + elem.tagName + " text:" + elem.textContent)
}

// Create a MutationObserver to watch for changes to the DOM.
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach(processNode)
        } else {
            processNode(mutation.target)
        }
    })
})

// Enable the content script by default.
let enabled = true
const keys = ["enabled", "item"]

chrome.storage.sync.get(keys, (data) => {
    if (data.enabled === false) {
        enabled = false
    }
    if (data.item) {
        textToBlur = data.item
    }
    // Only start observing the DOM if the extension is enabled and there is text to blur.
    if (enabled && textToBlur.trim().length > 0) {
        observer.observe(document, {
            attributes: false,
            characterData: true,
            childList: true,
            subtree: true,
        })
        // Loop through all elements on the page for initial processing.
        processNode(document)
    }
})
