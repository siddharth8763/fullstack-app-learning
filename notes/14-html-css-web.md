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

## Responsive Design

### Media Queries
- Apply styles conditionally based on viewport width, height, or device characteristics.
- **Mobile-first approach**: Write base styles for mobile, then add `min-width` media queries for larger screens.

```css
/* Mobile first */
.container { padding: 16px; }

@media (min-width: 768px) {
  .container { padding: 32px; max-width: 720px; margin: 0 auto; }
}

@media (min-width: 1024px) {
  .container { max-width: 960px; }
}
```

### CSS Units
| Unit | Relative To | Use Case |
|---|---|---|
| `px` | Absolute | Borders, shadows, fine-grained control |
| `em` | Parent's font-size | Component-level scaling |
| `rem` | Root (`<html>`) font-size | Global spacing, typography |
| `%` | Parent element's size | Fluid widths |
| `vw` / `vh` | Viewport width / height | Full-screen sections, hero banners |
| `fr` | Fraction of available space in Grid | Grid column/row sizing |

## CSS Variables (Custom Properties)

```css
:root {
  --primary-color: #3b82f6;
  --spacing-md: 16px;
  --border-radius: 8px;
}

.button {
  background-color: var(--primary-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
}

/* Can be overridden in scope */
.dark-theme {
  --primary-color: #60a5fa;
}
```

## Position Property
| Value | Behavior |
|---|---|
| `static` | Default. Normal document flow. |
| `relative` | Positioned relative to its normal position. Still takes up original space. |
| `absolute` | Positioned relative to the nearest positioned ancestor (non-static). Removed from flow. |
| `fixed` | Positioned relative to the viewport. Stays in place on scroll. |
| `sticky` | Hybrid. Behaves like `relative` until it hits a scroll threshold, then acts like `fixed`. |

### z-index and Stacking Context
- `z-index` only works on positioned elements (not `static`).
- A new **stacking context** is created by: `z-index` + `position`, `opacity < 1`, `transform`, `filter`, `will-change`.
- A child element's z-index is scoped within its parent's stacking context.

## Pseudo-classes and Pseudo-elements
- **Pseudo-classes** (`:hover`, `:focus`, `:nth-child`, `:first-child`): Select elements based on state or position.
- **Pseudo-elements** (`::before`, `::after`, `::placeholder`): Create virtual elements for styling. Require `content` property.

## BEM Naming Convention
- **Block**: Standalone entity (`.card`).
- **Element**: Part of a block (`.card__title`).
- **Modifier**: Variation of a block/element (`.card--highlighted`, `.card__title--large`).

## Image Optimization
- Use **`<picture>`** with `<source>` for responsive images in different formats (WebP, AVIF fallback to JPEG).
- Use `loading="lazy"` for below-the-fold images.
- Always set `width` and `height` attributes to prevent CLS.
- Use `srcset` for serving different resolutions based on device pixel ratio.

## Service Workers and PWA Basics
- **Service Worker**: A script that runs in the background, separate from the web page. Intercepts network requests and enables offline support.
- **Progressive Web App (PWA)**: A web app that uses service workers, manifests, and HTTPS to provide a native-app-like experience (installable, offline-capable, push notifications).

## Additional Interview Questions

### Q: What is the difference between `em` and `rem`?
A: `em` is relative to the computed font-size of the parent element (compounds when nested). `rem` (root em) is always relative to the root `<html>` font-size, making it predictable regardless of nesting depth.

### Q: How does CSS `float` work and why is Flexbox preferred?
A: `float` was designed for wrapping text around images, not layouts. It removes elements from normal flow and requires clearfix hacks. Flexbox was designed specifically for layout, providing predictable alignment, spacing, and ordering without hacks.

### Q: What is FOUC (Flash of Unstyled Content)?
A: A brief moment where the browser renders HTML before CSS is loaded and applied. Prevented by placing `<link>` stylesheet tags in the `<head>`, using `preload` for critical CSS, or inlining critical CSS.
