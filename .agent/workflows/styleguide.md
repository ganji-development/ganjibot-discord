# Ganjibot Frontend Style Guide

This document defines the styling conventions for the Ganjibot web dashboard.

## CSS Variables

**All styling must use CSS variables from `docs/variables.css`**. This file is the single source of truth for:

- Brand colors (`--color-brand-*`)
- Semantic colors (`--color-success`, `--color-error`, etc.)
- Theme colors (auto-switches for dark mode)
- Typography (`--font-*`, `--text-*`)
- Spacing (`--space-*`)
- Border radius (`--radius-*`)
- Shadows (`--shadow-*`)
- Transitions (`--transition-*`)
- Z-index layers (`--z-*`)

## Usage Rules

### ✅ DO

```css
.button {
  background: var(--color-brand-500);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
}
```

### ❌ DON'T

```css
.button {
  background: #5fbc60; /* Never hardcode colors */
  padding: 8px 16px;   /* Use spacing variables */
  border-radius: 8px;  /* Use radius variables */
}
```

## Vanilla CSS Only

- **No Tailwind CSS** - Use vanilla CSS with variables
- **No CSS-in-JS** - Keep styles in `.css` files
- Import `variables.css` at the top of your main CSS file

## Dark Mode

Dark mode is automatic via `[data-theme='dark']` selector in variables.css. All components inherit correct colors without additional code.

## File Organization

```
frontend/src/
├── styles/
│   ├── variables.css  (copy from docs/)
│   ├── global.css     (resets, base styles)
│   └── components/    (component-specific styles)
```
