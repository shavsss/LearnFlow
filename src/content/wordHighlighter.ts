/**
 * Utility to wrap words inside an HTMLElement with spans carrying class "learnflow-word".
 * The caller provides a callback for click handling.
 */
export function highlightWords(
  container: HTMLElement,
  handleClick: (word: string, ev: MouseEvent) => void
) {
  const text = container.textContent ?? "";
  const words = text.split(/\s+/).filter(Boolean);
  const frag = document.createDocumentFragment();
  words.forEach((w, i) => {
    const span = document.createElement("span");
    span.className = "learnflow-word";
    span.textContent = w;
    span.addEventListener("click", (e) => handleClick(w, e as MouseEvent));
    frag.appendChild(span);
    if (i < words.length - 1) frag.appendChild(document.createTextNode(" "));
  });
  container.replaceChildren(frag);
}
