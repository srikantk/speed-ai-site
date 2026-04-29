(function () {
  function shouldSkip(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    const tag = parent.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEXTAREA") return true;
    if (parent.closest(".brand-split-ignore")) return true;
    if (parent.closest(".btn-primary")) return true;
    return false;
  }

  function splitBrandText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !node.nodeValue.includes("Speed ")) continue;
      if (shouldSkip(node)) continue;
      nodes.push(node);
    }

    const pattern = /\bSpeed\s+([A-Z][A-Za-z0-9-]{1,})\b/g;
    const excludedWords = new Set(["PDF"]);

    nodes.forEach((node) => {
      const text = node.nodeValue;
      if (!pattern.test(text)) return;
      pattern.lastIndex = 0;

      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const start = match.index;
        const end = pattern.lastIndex;
        const productWord = match[1];

        if (start > lastIndex) {
          frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
        }

        if (excludedWords.has(productWord.toUpperCase())) {
          frag.appendChild(document.createTextNode(text.slice(start, end)));
          lastIndex = end;
          continue;
        }

        const speed = document.createElement("span");
        speed.className = "brand-speed";
        speed.textContent = "Speed";

        const xyz = document.createElement("span");
        xyz.className = "brand-xyz";
        xyz.textContent = productWord;

        frag.appendChild(speed);
        frag.appendChild(xyz);

        lastIndex = end;
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      node.parentNode.replaceChild(frag, node);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      splitBrandText(document.body);
    });
  } else {
    splitBrandText(document.body);
  }
})();
