# Frontend Project Rules - Next.js POS Frontend

## 🏗️ Architecture Overview

This frontend follows **Next.js 14** with **App Router** and uses a component-based architecture with clear separation of concerns:

- **Pages**: Route-based components using Next.js App Router
- **Components**: Reusable UI components with clear responsibilities
- **Services**: API communication and business logic
- **Hooks**: Custom React hooks for state management
- **Types**: TypeScript interfaces and types

## 📁 Directory Structure Rules

### App Router Structure

```
src/app/
├── (auth)/              # Route groups for authentication
├── dashboard/
│   ├── admin/           # Admin-specific pages
│   │   ├── branches/
│   │   ├── products/
│   │   └── users/
│   ├── cashier/         # Cashier-specific pages
│   │   ├── sales/
│   │   ├── orders/
│   │   └── tables/
│   └── layout.tsx       # Dashboard layout
├── components/          # Shared components
├── globals.css          # Global styles
├── layout.tsx           # Root layout
└── page.tsx             # Home page
```

### Component Organization

```
src/components/
├── ui/                  # Base UI components (shadcn/ui)
├── admin/               # Admin-specific components
├── cashier/             # Cashier-specific components
├── shared/              # Shared business components
└── theme-provider.tsx   # Theme configuration
```

## 🎯 Naming Conventions

### Files and Directories

- **PascalCase** for components, interfaces, and types
- **camelCase** for functions, variables, and files
- **kebab-case** for directories
- **UPPER_SNAKE_CASE** for constants

### Component Naming

- **Pages**: `page.tsx` (Next.js convention)
- **Components**: `ProductCard.tsx`, `OrderForm.tsx`
- **Layouts**: `layout.tsx`, `DashboardLayout.tsx`
- **Hooks**: `useSalesState.ts`, `useProductSearch.ts`
- **Services**: `productService.ts`, `orderService.ts`
- **Types**: `Product.ts`, `Order.ts`

## 🔧 Component Rules

### 1. Component Structure

- Use functional components with hooks
- Implement proper TypeScript typing
- Follow single responsibility principle
- Example:

```typescript
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isSelected?: boolean;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  isSelected = false 
}: ProductCardProps) {
  const handleClick = () => {
    onAddToCart(product);
  };

  return (
    <Card className={cn("cursor-pointer", isSelected && "ring-2 ring-primary")}>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${product.price.toLocaleString()}</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleClick} className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### 2. State Management

- Use React hooks for local state
- Implement custom hooks for complex state
- Use context for global state when needed
- Example:

```typescript
// Custom hook for sales state
export function useSalesState() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  return {
    cart,
    selectedCustomer,
    paymentMethod,
    addToCart,
    removeFromCart,
    setSelectedCustomer,
    setPaymentMethod
  };
}
```

### 3. Form Handling

- Use React Hook Form for form management
- Implement proper validation with Zod
- Handle form submission with loading states
- Example:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional()
});

type CreateProductForm = z.infer<typeof createProductSchema>;

export function CreateProductForm() {
  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      categoryId: "",
      description: ""
    }
  });

  const onSubmit = async (data: CreateProductForm) => {
    try {
      await createProduct(data);
      toast.success("Product created successfully");
      form.reset();
    } catch (error) {
      toast.error("Failed to create product");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Create Product</Button>
      </form>
    </Form>
  );
}
```

## 🚀 Service Layer Rules

### 1. API Service Structure

- Create service files for each domain
- Use consistent error handling
- Implement proper TypeScript types
- Example:

```typescript
// services/products.ts
export class ProductService {
  private static instance: ProductService;
  private baseUrl = '/api/products';

  static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }
    return ProductService.instance;
  }

  async getProducts(params?: GetProductsParams): Promise<Product[]> {
    try {
      const response = await fetch(`${this.baseUrl}?${new URLSearchParams(params)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async createProduct(product: CreateProductDto): Promise<Product> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create product');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }
}

export const productService = ProductService.getInstance();
```

### 2. Error Handling

- Implement consistent error handling
- Use toast notifications for user feedback
- Log errors for debugging
- Example:

```typescript
export function useApiError() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    console.error('API Error:', error);
    
    let message = fallbackMessage || 'An unexpected error occurred';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  return { handleError };
}
```

## 🎨 UI/UX Rules

### 1. Design System

- Use shadcn/ui components as base
- Maintain consistent spacing and typography
- Follow accessibility guidelines
- Use Tailwind CSS for styling

### 2. Responsive Design

- Mobile-first approach
- Test on multiple screen sizes
- Use responsive utilities from Tailwind
- Example:

```typescript
export function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
```

### 3. Loading States

- Show loading indicators for async operations
- Use skeleton components for content loading
- Implement optimistic updates where appropriate
- Example:

```typescript
export function ProductGrid() {
  const { data: products, isLoading, error } = useProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load products" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products?.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 🔒 Security Rules

### 1. Authentication

- Use Next.js middleware for route protection
- Implement proper session management
- Validate user permissions on client side
- Example:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  const { pathname } = request.nextUrl;

  // Public routes
  if (pathname === '/' || pathname.startsWith('/auth')) {
    return NextResponse.next();
  }

  // Protected routes
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 2. Data Validation

- Validate all user inputs
- Sanitize data before sending to API
- Use TypeScript for type safety
- Implement proper error boundaries

## 📱 Mobile-First Rules

### 1. Touch Interactions

- Use appropriate touch targets (min 44px)
- Implement swipe gestures where appropriate
- Test on actual mobile devices
- Example:

```typescript
export function MobileFriendlyButton({ children, ...props }: ButtonProps) {
  return (
    <Button 
      {...props}
      className="min-h-[44px] min-w-[44px] touch-manipulation"
    >
      {children}
    </Button>
  );
}
```

### 2. Performance

- Optimize images and assets
- Use Next.js Image component
- Implement lazy loading
- Minimize bundle size

## 🧪 Testing Rules

### 1. Component Testing

- Test component rendering
- Test user interactions
- Mock external dependencies
- Use React Testing Library
- Example:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    price: 10.99,
    description: 'Test description'
  };

  const mockOnAddToCart = jest.fn();

  it('renders product information correctly', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.99')).toBeInTheDocument();
  });

  it('calls onAddToCart when button is clicked', () => {
    render(
      <ProductCard 
        product={mockProduct} 
        onAddToCart={mockOnAddToCart} 
      />
    );

    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockOnAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

### 2. Integration Testing

- Test API integration
- Test user workflows
- Test error scenarios
- Use MSW for API mocking

## 📊 State Management Rules

### 1. Local State

- Use `useState` for simple state
- Use `useReducer` for complex state
- Use `useCallback` and `useMemo` for optimization

### 2. Global State

- Use React Context for global state
- Keep context providers minimal
- Split contexts by domain
- Example:

```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const user = await authService.login(credentials);
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    authService.logout();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 🚀 Performance Rules

### 1. Code Splitting

- Use dynamic imports for large components
- Implement route-based code splitting
- Lazy load non-critical components
- Example:

```typescript
const ProductManagement = lazy(() => import('./ProductManagement'));

export function AdminDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductManagement />
    </Suspense>
  );
}
```

### 2. Optimization

- Use `React.memo` for expensive components
- Implement proper key props for lists
- Avoid unnecessary re-renders
- Use `useCallback` and `useMemo` appropriately

## 📝 Documentation Rules

### 1. Component Documentation

- Document complex components with JSDoc
- Include usage examples
- Document props interface
- Example:

```typescript
/**
 * ProductCard component displays product information in a card format
 * 
 * @param product - The product to display
 * @param onAddToCart - Callback function when add to cart is clicked
 * @param isSelected - Whether the product is currently selected
 * 
 * @example
 * ```tsx
 * <ProductCard 
 *   product={product} 
 *   onAddToCart={handleAddToCart}
 *   isSelected={selectedProduct?.id === product.id}
 * />
 * ```
 */
export function ProductCard({ product, onAddToCart, isSelected }: ProductCardProps) {
  // Component implementation
}
```

### 2. API Documentation

- Document service methods
- Include error scenarios
- Document data types
- Keep documentation up to date

## 🔄 Version Control Rules

### 1. Commit Messages

- Use conventional commits format
- Include component scope for UI changes
- Reference design tickets when applicable
- Example:

```
feat(ui): add product card component
fix(auth): resolve login redirect issue
style(sales): improve mobile layout
```

### 2. Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/ui/*`: UI/UX features
- `feature/auth/*`: Authentication features
- `bugfix/*`: Bug fixes

## 🎨 Design System Rules

### 1. Color Palette

- Use consistent color tokens
- Implement dark mode support
- Ensure proper contrast ratios
- Follow WCAG guidelines

### 2. Typography

- Use consistent font families
- Implement proper font scaling
- Ensure readability across devices
- Use semantic HTML elements

### 3. Spacing

- Use consistent spacing scale
- Implement responsive spacing
- Use Tailwind spacing utilities
- Maintain visual hierarchy

## 📱 Accessibility Rules

### 1. ARIA Labels

- Use proper ARIA labels
- Implement keyboard navigation
- Ensure screen reader compatibility
- Test with accessibility tools

### 2. Focus Management

- Implement proper focus order
- Use focus indicators
- Handle focus in modals
- Test keyboard navigation

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

---

*This document should be updated as the frontend evolves and new patterns emerge.* 