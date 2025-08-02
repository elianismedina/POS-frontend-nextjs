"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Type, 
  Layout, 
  Zap,
  Sun,
  Moon,
  Monitor
} from "lucide-react";

export default function ThemeDemoPage() {
  const { themeUtils } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container-pos py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Theme System Demo</h1>
              <p className="text-muted-foreground mt-2">
                Comprehensive theme system with League Spartan typography
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="container-pos py-8">
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Typography
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Components
            </TabsTrigger>
            <TabsTrigger value="utilities" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Utilities
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Color System</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Primary Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-primary text-primary-foreground p-4 rounded-lg">
                      <div className="font-semibold">Primary</div>
                      <div className="text-sm opacity-90">Main brand color</div>
                    </div>
                    <div className="bg-secondary text-secondary-foreground p-4 rounded-lg">
                      <div className="font-semibold">Secondary</div>
                      <div className="text-sm opacity-90">Secondary actions</div>
                    </div>
                    <div className="bg-accent text-accent-foreground p-4 rounded-lg">
                      <div className="font-semibold">Accent</div>
                      <div className="text-sm opacity-90">Subtle highlighting</div>
                    </div>
                  </div>
                </div>

                {/* Status Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-success text-success-foreground p-4 rounded-lg">
                      <div className="font-semibold">Success</div>
                      <div className="text-sm opacity-90">Positive actions</div>
                    </div>
                    <div className="bg-warning text-warning-foreground p-4 rounded-lg">
                      <div className="font-semibold">Warning</div>
                      <div className="text-sm opacity-90">Warnings</div>
                    </div>
                    <div className="bg-destructive text-destructive-foreground p-4 rounded-lg">
                      <div className="font-semibold">Error</div>
                      <div className="text-sm opacity-90">Errors</div>
                    </div>
                    <div className="bg-info text-info-foreground p-4 rounded-lg">
                      <div className="font-semibold">Info</div>
                      <div className="text-sm opacity-90">Information</div>
                    </div>
                  </div>
                </div>

                {/* Neutral Colors */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Neutral Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted text-muted-foreground p-4 rounded-lg">
                      <div className="font-semibold">Muted</div>
                      <div className="text-sm opacity-90">Subtle backgrounds</div>
                    </div>
                    <div className="bg-card text-card-foreground border border-border p-4 rounded-lg">
                      <div className="font-semibold">Card</div>
                      <div className="text-sm opacity-90">Card backgrounds</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Headings */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Headings</h3>
                  <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Heading 1 - Main Title</h1>
                    <h2 className="text-3xl font-semibold tracking-tight">Heading 2 - Section Title</h2>
                    <h3 className="text-2xl font-semibold tracking-tight">Heading 3 - Subsection</h3>
                    <h4 className="text-xl font-semibold tracking-tight">Heading 4 - Card Title</h4>
                    <h5 className="text-lg font-medium tracking-tight">Heading 5 - Small Title</h5>
                    <h6 className="text-base font-medium tracking-tight">Heading 6 - Micro Title</h6>
                  </div>
                </div>

                {/* Body Text */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Body Text</h3>
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed">
                      Large body text - Perfect for important content and descriptions that need to stand out.
                    </p>
                    <p className="text-base leading-relaxed">
                      Standard body text - This is the default text size for most content in the application.
                    </p>
                    <p className="text-sm leading-relaxed">
                      Small body text - Used for secondary information, captions, and less important content.
                    </p>
                  </div>
                </div>

                {/* Special Text */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Special Text</h3>
                  <div className="space-y-4">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      Caption Text - Used for labels and small identifiers
                    </span>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="font-mono text-sm">
                        Monospace text - Perfect for code, IDs, and technical information
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Component Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Buttons */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Buttons</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="outline">Outline Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                  </div>
                </div>

                {/* Cards */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Cards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Base Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Standard card with subtle shadow and border.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="shadow-md">
                      <CardHeader>
                        <CardTitle>Elevated Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Card with enhanced shadow for emphasis.
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-0">
                      <CardHeader>
                        <CardTitle>Flat Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Card without border for clean look.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Form Elements */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge className="bg-success text-success-foreground">Success</Badge>
                    <Badge className="bg-warning text-warning-foreground">Warning</Badge>
                    <Badge className="bg-destructive text-destructive-foreground">Error</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Utility Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Spacing */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Spacing Utilities</h3>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="bg-primary text-primary-foreground p-2 rounded">Item 1</div>
                      <div className="bg-primary text-primary-foreground p-2 rounded">Item 2</div>
                      <div className="bg-primary text-primary-foreground p-2 rounded">Item 3</div>
                    </div>
                    <div className="space-y-2">
                      <div className="bg-secondary text-secondary-foreground p-2 rounded">Item 1</div>
                      <div className="bg-secondary text-secondary-foreground p-2 rounded">Item 2</div>
                      <div className="bg-secondary text-secondary-foreground p-2 rounded">Item 3</div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-accent text-accent-foreground p-2 rounded">Item 1</div>
                      <div className="bg-accent text-accent-foreground p-2 rounded">Item 2</div>
                      <div className="bg-accent text-accent-foreground p-2 rounded">Item 3</div>
                    </div>
                  </div>
                </div>

                {/* Animations */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Animation Utilities</h3>
                  <div className="flex gap-4">
                    <div className="animate-fade-in bg-primary text-primary-foreground p-4 rounded">
                      Fade In
                    </div>
                    <div className="animate-slide-up bg-secondary text-secondary-foreground p-4 rounded">
                      Slide Up
                    </div>
                    <div className="animate-scale-in bg-accent text-accent-foreground p-4 rounded">
                      Scale In
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Layout Utilities</h3>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded">
                      <h4 className="font-semibold mb-2">Container</h4>
                      <p className="text-sm text-muted-foreground">
                        Responsive container with consistent padding
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded">
                      <h4 className="font-semibold mb-2">Section</h4>
                      <p className="text-sm text-muted-foreground">
                        Responsive section with vertical padding
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Theme Toggle Component
function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme("light")}
        className={theme === "light" ? "bg-primary text-primary-foreground" : ""}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme("dark")}
        className={theme === "dark" ? "bg-primary text-primary-foreground" : ""}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme("system")}
        className={theme === "system" ? "bg-primary text-primary-foreground" : ""}
      >
        <Monitor className="h-4 w-4" />
      </Button>
    </div>
  );
} 