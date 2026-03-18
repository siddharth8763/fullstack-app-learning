# HTML5, CSS, and Web Fundamentals Interview Notes

## Web Performance and Critical Rendering Path

### Critical Rendering Path (CRP)
The sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on the screen.
1. **DOM Tree**: Parses HTML to build the Document Object Model.
2. **CSSOM Tree**: Parses CSS to build the CSS Object Model.
3. **Render Tree**: Combines DOM and CSSOM to form a tree containing only nodes required to render the page (e.g., skips `display: none`).
4. **Layout (Reflow)**: Calculates the exact position and size of each node.
5. **Paint**: Draws pixels on the screen (rasterization).
6. **Composite**: Groups layers together and draws them to the screen (useful for fixed elements or CSS transforms).

### Core Web Vitals (CWV)
Google's standardized metrics to measure user experience:
1. **Largest Contentful Paint (LCP)**: Measures loading performance. Should hit < 2.5s.
2. **First Input Delay (FID)** (being replaced by **INP**): Measures interactivity/responsiveness. Time from user interaction to browser processing it. Should be < 100ms.
3. **Cumulative Layout Shift (CLS)**: Measures visual stability. Identifies unexpected layout shifts. Should be < 0.1.

### Optimizing Performance
- **Preload/Prefetch**: `<link rel="preload">` explicitly instructs the browser to download a resource vital for current page early.
- **Async vs Defer for Scripts**:
  - `<script async>`: Downloads asynchronously, then pauses HTML parsing to execute immediately.
  - `<script defer>`: Downloads asynchronously, but guarantees execution *after* HTML parsing finishes, in the order they appear.

## CSS Layouts

### Box Model
- **Content**: The actual content of the element.
- **Padding**: Clears an area around the content. Inside the element's bounds.
- **Border**: A border that goes around the padding and content.
- **Margin**: Clears an area outside the border.
- **`box-sizing: border-box`**: In this mode, padding and border are included in the element's assigned width and height, preventing unexpected expanding.

### Flexbox (1-Dimensional Layout)
- Designed for layout out items in a single row or column.
- Containers: `display: flex; flex-direction: row | column; justify-content: ... align-items: ...`
- Items: `flex-grow`, `flex-shrink`, `flex-basis`.

### Grid (2-Dimensional Layout)
- Designed for laying out items in both columns and rows.
- Containers: `display: grid; grid-template-columns: 1fr 1fr; grid-gap: 16px;`

## Semantic HTML and Accessibility (a11y)

### Semantic Tags
- Tags that carry meaning about their content.
- e.g., `<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`.
- **Why?** Better SEO, easier code readability, and critical for screen readers to navigate the page effectively.

### Accessibility Basics
- **`alt` text**: Always provide descriptive alt text for images `<img>`.
- **Contrast Ratios**: Text should have a high contrast against its background (WCAG AA standard is 4.5:1).
- **ARIA (Accessible Rich Internet Applications)**: HTML attributes to supplement semantics where native HTML falls short. E.g., `aria-hidden="true"`, `aria-label`, `role="dialog"`.

## Browser Storage

| Storage Type | Capacity | Accessibility | Expiration | Use Case |
|---|---|---|---|---|
| **Cookies** | 4KB | Any window/server request | Manual / Set expiry | Session IDs, Server communication |
| **Local Storage** | 5-10MB | Any window in origin | Never | Storing theme preferences, long-term non-sensitive data |
| **Session Storage**| 5MB | Same tab/window | Tab closes | Temporary form data |
| **IndexedDB** | >50MB | Any window in origin | Never | Complex offline data sync, PWA cache |

## Common Interview Questions

### Q: What is the difference between `display: none` and `visibility: hidden`?
A: `display: none` removes the element entirely from the render tree, so it takes up no space. `visibility: hidden` hides the element visually, but it still maintains its space, affecting the layout calculation.

### Q: What causes a Layout / Reflow?
A: Any change that affects dimensions or positions of elements. Examples: changing `width`, `height`, `font-size`, window resizing, DOM node insertion. Reflows are expensive operations for the browser.

### Q: How can you write performance-friendly animations?
A: Stick to animating `transform` and `opacity`. These properties can be handled directly by the GPU in the **composite** phase, bypassing the expensive layout and paint phases.

### Q: Explain the concept of CSS Specificity.
A: The rules browsers use to determine which style applies when multiple selectors match an element. Order of weight: `!important` (overrides everything) -> Inline styles -> IDs -> Classes, Attributes, and pseudo-classes -> Elements and pseudo-elements.
