# HummingbirdPantry UI/UX Styleguide

## Inspiration Sources

This styleguide draws inspiration from:
- **[Mori](https://www.mori.com)** - Natural food protection company with clean, organic aesthetic
- **[Super Normal Greens](https://www.supernormalgreens.com)** - Modern health food brand with sophisticated design

## 🎨 Design Philosophy

**Natural + Modern + Functional**
- Clean, minimal aesthetic inspired by natural food products
- Sophisticated color palette drawn from fresh produce and herbs
- Typography that feels both organic and professional
- Focus on usability with subtle elegance

---

## 🌈 Color Palette

### Primary Colors (Inspired by Mori's natural aesthetic)

```css
/* Core Brand Colors */
--color-primary-50: #f0fdf4;   /* Fresh mint green */
--color-primary-100: #dcfce7;  /* Light sage */
--color-primary-200: #bbf7d0;  /* Soft green */
--color-primary-300: #86efac;  /* Garden green */
--color-primary-400: #4ade80;  /* Vibrant green */
--color-primary-500: #22c55e;  /* Primary green */
--color-primary-600: #16a34a;  /* Deep green */
--color-primary-700: #15803d;  /* Forest green */
--color-primary-800: #166534;  /* Dark forest */
--color-primary-900: #14532d;  /* Deep forest */
```

### Secondary Colors (Fresh produce inspired)

```css
/* Natural Produce Colors */
--color-carrot: #ea580c;     /* Carrot orange */
--color-carrot-light: #fed7aa;
--color-carrot-dark: #9a3412;

--color-beet: #dc2626;       /* Beet red */
--color-beet-light: #fecaca;
--color-beet-dark: #991b1b;

--color-blueberry: #3730a3; /* Blueberry */
--color-blueberry-light: #c7d2fe;
--color-blueberry-dark: #1e1b4b;

--color-spinach: #166534;   /* Spinach green */
--color-spinach-light: #dcfce7;
--color-spinach-dark: #052e16;
```

### Neutral Colors (Clean and sophisticated)

```css
/* Sophisticated Neutrals */
--color-neutral-50: #fafaf9;   /* Warm white */
--color-neutral-100: #f5f5f4;  /* Cream */
--color-neutral-200: #e7e5e4;  /* Light taupe */
--color-neutral-300: #d6d3d1;  /* Taupe */
--color-neutral-400: #a8a29e;  /* Warm gray */
--color-neutral-500: #78716c;  /* Medium gray */
--color-neutral-600: #57534e;  /* Dark gray */
--color-neutral-700: #44403c;  /* Darker gray */
--color-neutral-800: #292524;  /* Very dark */
--color-neutral-900: #1c1917;  /* Almost black */
```

### Semantic Colors (Inspired by Super Normal's health focus)

```css
/* Health & Status Colors */
--color-healthy: #22c55e;    /* Healthy green */
--color-expiring: #f59e0b;   /* Warning orange */
--color-expired: #ef4444;    /* Danger red */
--color-fresh: #06b6d4;      /* Fresh cyan */
--color-organic: #84cc16;    /* Organic lime */
```

---

## 📝 Typography

### Font Families

```css
/* Primary Font - Clean and modern (like Super Normal) */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;

/* Secondary Font - Organic feel (like Mori) */
--font-secondary: 'Crimson Text', 'Times New Roman', serif;

/* Monospace for code/data */
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### Font Scales

```css
/* Display sizes for hero sections */
--text-display-2xl: clamp(3rem, 8vw, 6rem);    /* 48px - 96px */
--text-display-xl: clamp(2.5rem, 6vw, 4rem);   /* 40px - 64px */
--text-display-lg: clamp(2rem, 4vw, 3rem);     /* 32px - 48px */

/* Heading hierarchy */
--text-heading-2xl: 3rem;    /* 48px */
--text-heading-xl: 2.25rem;  /* 36px */
--text-heading-lg: 1.875rem; /* 30px */
--text-heading-md: 1.5rem;   /* 24px */
--text-heading-sm: 1.25rem;  /* 20px */
--text-heading-xs: 1.125rem; /* 18px */

/* Body text */
--text-body-lg: 1.125rem;    /* 18px */
--text-body-base: 1rem;      /* 16px */
--text-body-sm: 0.875rem;    /* 14px */
--text-body-xs: 0.75rem;     /* 12px */

/* UI text */
--text-ui-lg: 1.125rem;      /* 18px */
--text-ui-base: 1rem;        /* 16px */
--text-ui-sm: 0.875rem;      /* 14px */
--text-ui-xs: 0.75rem;       /* 12px */
```

### Typography Classes

```css
/* Mori-inspired organic headings */
.hero-heading {
  font-family: var(--font-secondary);
  font-size: var(--text-display-xl);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-neutral-900);
}

/* Super Normal inspired clean headings */
.section-heading {
  font-family: var(--font-primary);
  font-size: var(--text-heading-xl);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-neutral-900);
}

/* Natural body text */
.body-text {
  font-family: var(--font-primary);
  font-size: var(--text-body-base);
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-neutral-700);
}
```

---

## 📐 Spacing & Layout

### Spacing Scale (Inspired by Mori's clean layout)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
```

### Layout Patterns

#### Hero Section (Mori-inspired)
```css
.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary-50) 0%, var(--color-neutral-50) 100%);
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  padding: var(--space-8);
  text-align: center;
  z-index: 2;
}
```

#### Product Cards (Super Normal inspired)
```css
.product-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  padding: var(--space-6);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid var(--color-neutral-200);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

#### Content Sections (Clean layout inspired by both)
```css
.content-section {
  padding: var(--space-16) 0;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 768px) {
  .content-container {
    padding: 0 var(--space-8);
  }
}
```

---

## 🎯 Interactive Elements

### Buttons (Inspired by Mori's natural feel)

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: var(--text-ui-base);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgb(34 197 94 / 0.3);
}
```

### Input Fields (Clean and minimal)

```css
.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-neutral-200);
  border-radius: 0.5rem;
  font-size: var(--text-body-base);
  font-family: var(--font-primary);
  background: white;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgb(34 197 94 / 0.1);
}

.form-input::placeholder {
  color: var(--color-neutral-400);
  font-style: italic;
}
```

### Cards and Containers

```css
/* Mori-inspired natural cards */
.natural-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
  border: 1px solid var(--color-neutral-100);
  overflow: hidden;
  transition: all 0.3s ease;
}

.natural-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
}

/* Super Normal inspired modern cards */
.modern-card {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
  border: 1px solid var(--color-neutral-200);
  padding: var(--space-6);
  position: relative;
}

.modern-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
  border-radius: 0.75rem 0.75rem 0 0;
}
```

---

## 📱 Mobile-First Responsive Design

### Breakpoints (Inspired by modern responsive design)

```css
/* Mobile-first approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Laptops */
--breakpoint-2xl: 1536px; /* Large screens */

/* Responsive typography */
.text-responsive-xl {
  font-size: clamp(2rem, 5vw, 3rem);
}

.text-responsive-lg {
  font-size: clamp(1.5rem, 4vw, 2.25rem);
}

.text-responsive-md {
  font-size: clamp(1.125rem, 3vw, 1.5rem);
}
```

### Mobile Navigation (Inspired by Super Normal)

```css
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--color-neutral-200);
  padding: var(--space-2);
  z-index: 50;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.nav-item.active {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
}
```

---

## 🎭 Animation & Micro-interactions

### Smooth Transitions (Inspired by Mori's elegant feel)

```css
/* Natural easing curves */
--ease-natural: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Page transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
  animation: pageEnter 0.6s var(--ease-natural) forwards;
}

@keyframes pageEnter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Loading States (Clean and natural)

```css
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-neutral-200);
  border-top: 3px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### Hover Effects (Subtle and natural)

```css
.hover-lift {
  transition: transform 0.3s var(--ease-natural);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

.hover-glow {
  transition: box-shadow 0.3s var(--ease-natural);
}

.hover-glow:hover {
  box-shadow: 0 8px 32px rgb(34 197 94 / 0.2);
}
```

---

## 🌱 Component Library

### Mori-Inspired Components

```css
/* Natural product showcase */
.product-showcase {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-8);
  padding: var(--space-12);
}

.product-item {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  transition: all 0.3s var(--ease-natural);
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-content {
  padding: var(--space-6);
}

/* Organic shapes and natural curves */
.organic-shape {
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
  background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
}
```

### Super Normal-Inspired Components

```css
/* Modern health-focused cards */
.health-card {
  background: linear-gradient(135deg, white 0%, var(--color-neutral-50) 100%);
  border: 1px solid var(--color-neutral-200);
  border-radius: 0.75rem;
  padding: var(--space-6);
  position: relative;
}

.health-indicator {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-healthy);
}

/* Clean data visualization */
.data-chart {
  background: white;
  border-radius: 0.5rem;
  padding: var(--space-4);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

.chart-bar {
  background: linear-gradient(180deg, var(--color-primary-400), var(--color-primary-600));
  border-radius: 2px;
  transition: height 0.3s var(--ease-natural);
}
```

---

## ♿ Accessibility Standards

### Focus Management

```css
/* Visible focus indicators */
.focus-visible:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip links for keyboard navigation */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary-600);
  color: white;
  padding: 8px;
  border-radius: 4px;
  text-decoration: none;
  z-index: 100;
}

.skip-link:focus {
  top: 6px;
}
```

### Color Contrast

```css
/* High contrast text combinations */
.text-high-contrast {
  color: var(--color-neutral-900);
  background: var(--color-neutral-50);
}

/* Accessible color combinations */
.text-accessible {
  color: var(--color-neutral-700);
}

.text-accessible strong {
  color: var(--color-neutral-900);
}
```

---

## 📊 Implementation Guidelines

### CSS Architecture

```css
/* Component-based CSS structure */
.component-name {
  /* Base styles */
}

.component-name--variant {
  /* Variant styles */
}

.component-name__element {
  /* Element styles */
}

.component-name--state {
  /* State styles */
}
```

### Utility Classes

```css
/* Spacing utilities */
.m-0 { margin: 0; }
.mt-4 { margin-top: var(--space-4); }
.mb-6 { margin-bottom: var(--space-6); }
.p-4 { padding: var(--space-4); }

/* Flex utilities */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }

/* Color utilities */
.text-primary { color: var(--color-primary-600); }
.bg-neutral { background: var(--color-neutral-100); }
.border-subtle { border-color: var(--color-neutral-200); }
```

### Design Tokens Usage

```javascript
// JavaScript usage of design tokens
const theme = {
  colors: {
    primary: 'var(--color-primary-500)',
    neutral: 'var(--color-neutral-700)',
    success: 'var(--color-success)'
  },
  spacing: {
    sm: 'var(--space-2)',
    md: 'var(--space-4)',
    lg: 'var(--space-6)'
  },
  typography: {
    heading: 'var(--font-primary)',
    body: 'var(--font-secondary)'
  }
}
```

---

## 🎨 Visual Style Summary

### Mori Inspiration Elements:
- Natural, organic color palette
- Clean, minimal layouts
- Food-focused imagery
- Gentle curves and natural shapes
- Warm, inviting typography

### Super Normal Inspiration Elements:
- Modern, sophisticated design
- Health-focused color schemes
- Clean typography hierarchy
- Subtle shadows and depth
- Data-driven visual elements

### HummingbirdPantry Synthesis:
- **Colors**: Natural greens with modern sophistication
- **Typography**: Clean sans-serif with organic serif accents
- **Layout**: Grid-based with natural flow
- **Components**: Card-based with subtle animations
- **Interactions**: Smooth transitions with natural easing

This styleguide creates a cohesive design system that feels both natural and modern, perfect for a pantry management app that handles food products with elegance and functionality. The combination of Mori's natural aesthetic and Super Normal's sophisticated design creates a unique, memorable brand identity that's both trustworthy and modern.
