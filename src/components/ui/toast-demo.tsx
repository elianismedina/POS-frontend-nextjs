"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function ToastDemo() {
  const { toast, success, error, warning, info } = useToast();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => {
          toast({
            title: "Default Toast",
            description: "This is a default toast message.",
          });
        }}
      >
        Default Toast
      </Button>

      <Button
        onClick={() => {
          success({
            title: "Success!",
            description: "Your action was completed successfully.",
          });
        }}
        className="bg-green-600 hover:bg-green-700"
      >
        Success Toast
      </Button>

      <Button
        onClick={() => {
          error({
            title: "Error!",
            description: "Something went wrong. Please try again.",
          });
        }}
        className="bg-red-600 hover:bg-red-700"
      >
        Error Toast
      </Button>

      <Button
        onClick={() => {
          warning({
            title: "Warning!",
            description: "Please be careful with this action.",
          });
        }}
        className="bg-yellow-600 hover:bg-yellow-700"
      >
        Warning Toast
      </Button>

      <Button
        onClick={() => {
          info({
            title: "Information",
            description: "Here's some useful information for you.",
          });
        }}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Info Toast
      </Button>

      <Button
        onClick={() => {
          toast({
            title: "Destructive Toast",
            description: "This is a destructive toast message.",
            variant: "destructive",
          });
        }}
        className="bg-red-600 hover:bg-red-700"
      >
        Destructive Toast
      </Button>
    </div>
  );
}
