"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface APIOption {
  id: string;
  name: string;
  description: string;
  endpoint: string;
  cost: number;
  previewImage: string;
  requiresStyleImage?: boolean;
}

interface Settings {
  strength: number;
  steps: number;
  guidance: number;
}

export default function FaceGenerator() {
  const [selectedAPI, setSelectedAPI] = useState("hairstyle");
  const [selfieImage, setSelfieImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face"
  );
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    strength: 0.85,
    steps: 25,
    guidance: 7.5,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiOptions: APIOption[] = [
    {
      id: "hairstyle",
      name: "AI Hairstyle",
      description: "Try new hairstyles instantly - from bob cuts to afros",
      endpoint: "/external/api/v1/hairstyle",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face", // turli soch stilli ayol
    },
    {
      id: "haircolor",
      name: "Hair Color Changer",
      description: "Transform your hair color - blonde to pink unicorn ✨",
      endpoint: "/external/api/v2/haircolor/",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face", // rangli sochli qiz
    },
    {
      id: "outfit",
      name: "AI Outfit",
      description: "Create complete new looks with AI styling",
      endpoint: "/external/api/v1/outfit",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop", // kiyim namoyishi
    },
    {
      id: "virtualtryon",
      name: "Virtual Outfit Try On",
      description: "Try on virtual clothes - test jackets and shirts",
      endpoint: "/external/api/v2/aivirtualtryon",
      cost: 2,
      previewImage:
        "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&h=400&fit=crop&crop=face", // ko‘ylak/ustki kiyim sinash
      requiresStyleImage: true,
    },
    {
      id: "faceswap",
      name: "AI Face Swap",
      description: "Swap faces like in memes, but professionally",
      endpoint: "/external/api/v1/face-swap",
      cost: 0.5,
      previewImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face", // yuz yaqin portret
      requiresStyleImage: true,
    },
    {
      id: "portrait",
      name: "AI Portrait",
      description: "Create beautiful studio-style portraits",
      endpoint: "/external/api/v1/portrait",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face", // professional studiya portret
    },
    {
      id: "replace",
      name: "AI Replace",
      description: "Replace backgrounds, accessories, and elements",
      endpoint: "/external/api/v1/replace",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face", // fonni almashtirishga mos
      requiresStyleImage: true,
    },
    {
      id: "cartoon",
      name: "AI Cartoon Generator",
      description: "Transform photos into cartoon characters",
      endpoint: "/external/api/v1/cartoon",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop&crop=face", // cartoon-style qiz
    },
    {
      id: "caricature",
      name: "AI Caricature",
      description: "Create humorous caricatures with big eyes and features",
      endpoint: "/external/api/v1/caricature",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop&crop=face", // kulgili yuz ifodasi
    },
    {
      id: "avatar",
      name: "AI Avatar Generator",
      description: "Create avatars in gaming, anime, or business styles",
      endpoint: "/external/api/v1/avatar",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face", // avatar-style qiz
    },
  ];

  const selectedAPIConfig =
    apiOptions.find((api) => api.id === selectedAPI) || apiOptions[0];

  const convertToRubles = (dollars: number) => {
    return (dollars * 95).toFixed(0);
  };

  const handleSelfieUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSelfieImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const generateFaceWithLightX = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "generate_face");
    formData.append("apiType", selectedAPI);
    formData.append("template", selectedAPIConfig.name);
    formData.append("style", "realistic");
    formData.append("strength", settings.strength.toString());

    setIsGenerating(true);

    try {
      const res = await fetch("/api/lightx", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok && result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
      } else {
        alert(`Generation Error: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert("Error during face generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGeneration = async () => {
    if (!selfieImage) {
      alert("Please upload a selfie first");
      return;
    }

    if (selfieImage.startsWith("data:")) {
      const response = await fetch(selfieImage);
      const blob = await response.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      await generateFaceWithLightX(file);
    } else {
      alert("Please upload a new selfie for generation");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 w-full">
        <div className="sm:max-w-4xl w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="sm:text-2xl font-black text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text">
              AI Face Generator Studio
            </h1>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelfieUpload}
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              📷 Upload Selfie
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
            <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
              Preview
            </h2>

            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
              {selfieImage ? (
                <div className="relative w-full h-full">
                  {/* Original/Generated image */}
                  <img
                    src={generatedImage || selfieImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Red comparison line */}
                  <div className="absolute top-0 h-full w-1 bg-red-500 shadow-lg z-10 left-1/2 transform -translate-x-1/2">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-400 via-red-500 to-red-400"></div>
                  </div>

                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
                        <div className="relative mb-6">
                          {/* Multiple spinning rings */}
                          <div className="animate-spin w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
                          <div
                            className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"
                            style={{
                              animationDirection: "reverse",
                              animationDuration: "1.5s",
                            }}
                          ></div>
                          <div
                            className="animate-spin w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full mx-auto absolute top-4 left-1/2 transform -translate-x-1/2"
                            style={{ animationDuration: "2s" }}
                          ></div>
                        </div>

                        <div className="text-lg font-bold text-gray-800 mb-2">
                          Generating Magic ✨
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          Creating your {selectedAPIConfig.name.toLowerCase()}
                          ...
                        </div>

                        {/* Bouncing dots */}
                        <div className="flex justify-center gap-1">
                          <div
                            className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <div className="text-6xl mb-4">📷</div>
                    <div className="text-lg font-semibold">
                      Upload a selfie to get started
                    </div>
                    <div className="text-sm mt-2">
                      Choose from 10 amazing AI transformations
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
            <h2 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3">
              <span className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              AI Transformation Studio
            </h2>

            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-800 mb-4">
                Choose AI Transformation:
              </label>
              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto p-2">
                {apiOptions.map((api) => (
                  <div
                    key={api.id}
                    onClick={() => setSelectedAPI(api.id)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                      selectedAPI === api.id
                        ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                        : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    <img
                      src={api.previewImage || ""}
                      alt={api.name}
                      className="w-full h-20 object-cover rounded-xl mb-3"
                    />
                    <h3 className="font-bold text-sm text-gray-800 mb-1">
                      {api.name}
                    </h3>
                    <p className="text-xs text-gray-600 mb-2">
                      {api.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600">
                        ₽{convertToRubles(api.cost * 0.01)}
                      </span>
                      {api.requiresStyleImage && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                          Style Image
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                Settings
              </h3>

              <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-800">
                    Strength
                  </label>
                  <span className="text-lg font-bold text-indigo-700 bg-white px-3 py-1 rounded-full">
                    {settings.strength}
                  </span>
                </div>
                <Slider
                  value={[settings.strength]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({ ...prev, strength: value }))
                  }
                  max={1}
                  min={0}
                  step={0.05}
                />
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-800">
                    Steps
                  </label>
                  <span className="text-lg font-bold text-purple-700 bg-white px-3 py-1 rounded-full">
                    {settings.steps}
                  </span>
                </div>
                <Slider
                  value={[settings.steps]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({ ...prev, steps: value }))
                  }
                  max={50}
                  min={1}
                  step={1}
                />
              </div>

              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-gray-800">
                    Guidance
                  </label>
                  <span className="text-lg font-bold text-green-700 bg-white px-3 py-1 rounded-full">
                    {settings.guidance}
                  </span>
                </div>
                <Slider
                  value={[settings.guidance]}
                  onValueChange={([value]) =>
                    setSettings((prev) => ({ ...prev, guidance: value }))
                  }
                  max={20}
                  min={1}
                  step={0.5}
                />
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 text-xl"
              onClick={handleApplyGeneration}
              disabled={isGenerating || !selfieImage}
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                  <span>Generating Magic...</span>
                </div>
              ) : (
                <span>✨ Transform with {selectedAPIConfig.name} ✨</span>
              )}
            </Button>

            {/* API Info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-700">Selected API:</span>
                <span className="font-bold text-indigo-600">
                  {selectedAPIConfig.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="font-bold text-gray-700">Cost:</span>
                <span className="font-bold text-green-600">
                  ₽{convertToRubles(selectedAPIConfig.cost * 0.01)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
