# Loader Components

This directory contains reusable loader components for the POS frontend application.

## Components

### 1. Loader (`loader.tsx`)
A basic spinning loader animation with customizable sizes.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size of the loader (default: 'md')
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { Loader } from '@/components/ui/loader';

// Basic usage
<Loader />

// With custom size
<Loader size="lg" />

// With custom color
<Loader className="text-blue-500" />
```

### 2. FullScreenLoader (`full-screen-loader.tsx`)
A full-screen overlay loader for page transitions and major loading states.

**Props:**
- `message?: string` - Loading message (default: 'Loading...')
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { FullScreenLoader } from '@/components/ui/full-screen-loader';

// Basic usage
<FullScreenLoader />

// With custom message
<FullScreenLoader message="Processing your request..." />
```

### 3. LoadingOverlay (`loading-overlay.tsx`)
An overlay loader for specific content areas or cards.

**Props:**
- `isLoading: boolean` - Whether to show the overlay
- `message?: string` - Loading message (default: 'Loading...')
- `className?: string` - Additional CSS classes
- `children: React.ReactNode` - Content to overlay

**Usage:**
```tsx
import { LoadingOverlay } from '@/components/ui/loading-overlay';

<LoadingOverlay isLoading={loading} message="Loading content...">
  <div>Your content here</div>
</LoadingOverlay>
```

### 4. ButtonLoader (`button-loader.tsx`)
A loader component specifically designed for buttons with loading states.

**Props:**
- `isLoading: boolean` - Whether to show the loader
- `children: React.ReactNode` - Button content
- `loadingText?: string` - Text to show when loading (default: 'Loading...')
- `className?: string` - Additional CSS classes

**Usage:**
```tsx
import { ButtonLoader } from '@/components/ui/button-loader';

<Button disabled={loading}>
  <ButtonLoader isLoading={loading} loadingText="Processing...">
    Submit
  </ButtonLoader>
</Button>
```

## CSS Animation

The loader animation is defined in `globals.css`:

```css
.loader {
  --d: 22px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  color: #25b09b;
  box-shadow: 
    calc(1*var(--d))      calc(0*var(--d))     0 0,
    calc(0.707*var(--d))  calc(0.707*var(--d)) 0 1px,
    calc(0*var(--d))      calc(1*var(--d))     0 2px,
    calc(-0.707*var(--d)) calc(0.707*var(--d)) 0 3px,
    calc(-1*var(--d))     calc(0*var(--d))     0 4px,
    calc(-0.707*var(--d)) calc(-0.707*var(--d))0 5px,
    calc(0*var(--d))      calc(-1*var(--d))    0 6px;
  animation: l27 1s infinite steps(8);
}

@keyframes l27 {
  100% {transform: rotate(1turn)}
}
```

## Best Practices

1. **Use appropriate loaders for different contexts:**
   - `Loader` for inline loading states
   - `ButtonLoader` for form submissions
   - `LoadingOverlay` for content areas
   - `FullScreenLoader` for page transitions

2. **Provide meaningful loading messages** to improve user experience

3. **Disable interactive elements** when showing loaders to prevent multiple submissions

4. **Use consistent loading states** across the application

## Demo

Visit `/demo/loaders` to see all loader components in action.

## Integration Examples

### Auth Context Integration
```tsx
// In AuthContext.tsx
return (
  <AuthContext.Provider value={value}>
    {isLoading && <FullScreenLoader message="Initializing..." />}
    {children}
  </AuthContext.Provider>
);
```

### Page Loading States
```tsx
// In page components
<LoadingOverlay isLoading={loading} message="Loading branches...">
  <Card>
    {/* Your content */}
  </Card>
</LoadingOverlay>
```

### Form Submissions
```tsx
// In form components
<Button disabled={isSubmitting}>
  <ButtonLoader isLoading={isSubmitting} loadingText="Creating...">
    Create Branch
  </ButtonLoader>
</Button>
``` 