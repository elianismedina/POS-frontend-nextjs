"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader,
  FullScreenLoader,
  LoadingOverlay,
  ButtonLoader,
} from "@/components/ui";

const LoaderDemo = () => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);

  const handleButtonClick = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 2000);
  };

  const handleFullScreenClick = () => {
    setShowFullScreen(true);
    setTimeout(() => setShowFullScreen(false), 3000);
  };

  const handleOverlayClick = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Loader Components Demo</h1>
        <p className="text-muted-foreground">
          Showcasing different loader animations for various use cases
        </p>
      </div>

      {/* Full Screen Loader */}
      {showFullScreen && (
        <FullScreenLoader message="Processing your request..." />
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Loader */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Loader</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Loader size="sm" />
              <span className="text-sm">Small</span>
            </div>
            <div className="flex items-center gap-4">
              <Loader size="md" />
              <span className="text-sm">Medium</span>
            </div>
            <div className="flex items-center gap-4">
              <Loader size="lg" />
              <span className="text-sm">Large</span>
            </div>
          </CardContent>
        </Card>

        {/* Button Loader */}
        <Card>
          <CardHeader>
            <CardTitle>Button Loader</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleButtonClick} disabled={buttonLoading}>
              <ButtonLoader
                isLoading={buttonLoading}
                loadingText="Processing..."
              >
                Click to Load
              </ButtonLoader>
            </Button>
          </CardContent>
        </Card>

        {/* Loading Overlay */}
        <Card>
          <CardHeader>
            <CardTitle>Loading Overlay</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingOverlay
              isLoading={showOverlay}
              message="Loading content..."
            >
              <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  This content will be covered by the overlay when loading
                </p>
              </div>
            </LoadingOverlay>
            <Button
              onClick={handleOverlayClick}
              className="mt-4"
              disabled={showOverlay}
            >
              Show Overlay
            </Button>
          </CardContent>
        </Card>

        {/* Full Screen Loader Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Full Screen Loader</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleFullScreenClick} disabled={showFullScreen}>
              Show Full Screen Loader
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will show a full-screen loader for 3 seconds
            </p>
          </CardContent>
        </Card>

        {/* Custom Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Loader size="md" className="text-blue-500" />
              <span className="text-sm">Blue</span>
            </div>
            <div className="flex items-center gap-4">
              <Loader size="md" className="text-green-500" />
              <span className="text-sm">Green</span>
            </div>
            <div className="flex items-center gap-4">
              <Loader size="md" className="text-red-500" />
              <span className="text-sm">Red</span>
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-xs space-y-1">
              <p>
                <strong>Basic Loader:</strong> For inline loading states
              </p>
              <p>
                <strong>Button Loader:</strong> For form submissions
              </p>
              <p>
                <strong>Loading Overlay:</strong> For content areas
              </p>
              <p>
                <strong>Full Screen:</strong> For page transitions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoaderDemo;
