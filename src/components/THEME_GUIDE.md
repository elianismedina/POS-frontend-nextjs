# POS Theme System Guide

This guide explains how to use the comprehensive theme system built with Tailwind CSS and League Spartan typography.

## 🎨 Color System

### Primary Colors
- **Primary**: Teal (`hsl(173 58% 39%)`) - Main brand color
- **Secondary**: Light gray for secondary actions
- **Accent**: Subtle highlighting

### Status Colors
- **Success**: Green for positive actions
- **Warning**: Orange for warnings
- **Error**: Red for errors
- **Info**: Blue for informational content

### Usage
```tsx
// Using theme colors
<div className="bg-primary text-primary-foreground">Primary Button</div>
<div className="bg-success text-success-foreground">Success Message</div>
<div className="bg-destructive text-destructive-foreground">Error Message</div>
```

## 📝 Typography

### Font Family
- **Primary**: League Spartan (sans-serif)
- **Monospace**: JetBrains Mono (for code)

### Typography Scale
```tsx
// Headings
<h1 className="text-4xl font-bold tracking-tight">Heading 1</h1>
<h2 className="text-3xl font-semibold tracking-tight">Heading 2</h2>
<h3 className="text-2xl font-semibold tracking-tight">Heading 3</h3>
<h4 className="text-xl font-semibold tracking-tight">Heading 4</h4>
<h5 className="text-lg font-medium tracking-tight">Heading 5</h5>
<h6 className="text-base font-medium tracking-tight">Heading 6</h6>

// Body Text
<p className="text-base leading-relaxed">Body text</p>
<p className="text-sm leading-relaxed">Small body text</p>
<p className="text-lg leading-relaxed">Large body text</p>

// Caption
<span className="text-xs font-medium uppercase tracking-wider">Caption</span>

// Monospace
<code className="font-mono">Code text</code>
```

### Using Theme Utilities
```tsx
import { useTheme } from '@/components/theme-provider';

function MyComponent() {
  const { themeUtils } = useTheme();
  
  return (
    <div>
      <h1 className={themeUtils.typography.h1}>Title</h1>
      <p className={themeUtils.typography.body}>Content</p>
    </div>
  );
}
```

## 📏 Spacing System

### Consistent Spacing Scale
```tsx
// Vertical spacing
<div className="space-y-1">Extra Small</div>
<div className="space-y-2">Small</div>
<div className="space-y-4">Medium</div>
<div className="space-y-6">Large</div>
<div className="space-y-8">Extra Large</div>

// Gap spacing
<div className="gap-1">Extra Small Gap</div>
<div className="gap-2">Small Gap</div>
<div className="gap-4">Medium Gap</div>
<div className="gap-6">Large Gap</div>
<div className="gap-8">Extra Large Gap</div>
```

### Layout Components
```tsx
// Container
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  Content
</div>

// Sections
<section className="py-8 sm:py-12 lg:py-16">Large Section</section>
<section className="py-4 sm:py-6 lg:py-8">Small Section</section>
<section className="py-12 sm:py-16 lg:py-20">Extra Large Section</section>
```

## 🃏 Card Components

### Card Variants
```tsx
// Base card
<div className="bg-card border border-border rounded-lg shadow-sm">
  Card content
</div>

// Elevated card
<div className="bg-card border border-border rounded-lg shadow-md">
  Elevated content
</div>

// Flat card
<div className="bg-card rounded-lg">
  Flat content
</div>
```

## 🔘 Button Components

### Button Variants
```tsx
// Primary button
<button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</button>

// Secondary button
<button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Secondary Action
</button>

// Outline button
<button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground">
  Outline Action
</button>

// Ghost button
<button className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground">
  Ghost Action
</button>

// Destructive button
<button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete
</button>
```

## 🎭 Status Components

### Status Indicators
```tsx
// Success
<div className="bg-success text-success-foreground">Success message</div>

// Warning
<div className="bg-warning text-warning-foreground">Warning message</div>

// Error
<div className="bg-destructive text-destructive-foreground">Error message</div>

// Info
<div className="bg-info text-info-foreground">Info message</div>
```

## ✨ Animations

### Built-in Animations
```tsx
// Fade in
<div className="animate-fade-in">Fades in</div>

// Slide up
<div className="animate-slide-up">Slides up</div>

// Scale in
<div className="animate-scale-in">Scales in</div>
```

## 🌙 Dark Mode

The theme system automatically supports dark mode. Colors will automatically adjust based on the `class` attribute on the HTML element.

### Manual Theme Control
```tsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

## 🎯 Best Practices

### 1. Use Semantic Colors
```tsx
// ✅ Good - Uses semantic color
<div className="bg-primary text-primary-foreground">Primary action</div>

// ❌ Bad - Uses hardcoded color
<div className="bg-blue-500 text-white">Primary action</div>
```

### 2. Consistent Typography
```tsx
// ✅ Good - Uses typography scale
<h1 className="text-4xl font-bold tracking-tight">Title</h1>

// ❌ Bad - Inconsistent sizing
<h1 className="text-3xl font-bold">Title</h1>
```

### 3. Proper Spacing
```tsx
// ✅ Good - Uses consistent spacing
<div className="space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// ❌ Bad - Inconsistent spacing
<div>
  <div className="mb-2">Item 1</div>
  <div className="mb-4">Item 2</div>
</div>
```

### 4. Responsive Design
```tsx
// ✅ Good - Responsive spacing
<section className="py-8 sm:py-12 lg:py-16">
  Content
</section>

// ❌ Bad - Fixed spacing
<section className="py-8">
  Content
</section>
```

## 🔧 Customization

### Adding Custom Colors
Add to `globals.css`:
```css
:root {
  --custom-color: 200 100% 50%;
  --custom-color-foreground: 0 0% 100%;
}
```

### Adding Custom Spacing
Add to `tailwind.config.js`:
```js
spacing: {
  'custom': '2.5rem',
}
```

## 📚 Component Examples

### Card with Proper Typography
```tsx
function ProductCard({ product }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-semibold tracking-tight mb-2">
        {product.name}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {product.description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">
          ${product.price}
        </span>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
```

### Form with Consistent Spacing
```tsx
function ContactForm() {
  return (
    <form className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <input className="w-full px-3 py-2 border border-input rounded-md" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <input className="w-full px-3 py-2 border border-input rounded-md" />
      </div>
      <button className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90">
        Submit
      </button>
    </form>
  );
}
```

This theme system ensures consistency across your POS application while providing flexibility for customization. 