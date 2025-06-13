import React, { useEffect } from "react";

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  onUpload: (url: string) => void;
  uploadPreset: string;
  buttonText: string;
}

export const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  onUpload,
  uploadPreset,
  buttonText,
}) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => {
      console.log("Cloudinary script loaded successfully");
    };
    script.onerror = (error) => {
      console.error("Error loading Cloudinary script:", error);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleClick = () => {
    console.log("Upload button clicked");
    console.log("Cloudinary object:", window.cloudinary);
    console.log("Cloud name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
    console.log("Upload preset:", uploadPreset);

    if (!window.cloudinary) {
      console.error("Cloudinary widget not loaded");
      return;
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset,
        sources: ["local", "url", "camera"],
        multiple: false,
        maxFiles: 1,
        resourceType: "image",
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#FF620C",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1",
          },
        },
      },
      (error: any, result: any) => {
        console.log("Upload result:", result);
        if (!error && result && result.event === "success") {
          console.log("Upload successful, URL:", result.info.secure_url);
          onUpload(result.info.secure_url);
        } else if (error) {
          console.error("Upload error:", error);
        }
      }
    );

    widget.open();
  };

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg
          className="-ml-1 mr-2 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
          />
        </svg>
        {buttonText}
      </button>
      <p className="mt-1 text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
    </div>
  );
};
