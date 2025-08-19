"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
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
  requiresTextPrompt?: boolean;
  supportedSettings: ("strength" | "steps" | "guidance")[];
  defaultSettings: Partial<Settings>;
  settingsRanges: {
    strength?: { min: number; max: number; step: number };
    steps?: { min: number; max: number; step: number };
    guidance?: { min: number; max: number; step: number };
  };
  promptPlaceholder?: string;
}

interface Settings {
  strength: number;
  steps: number;
  guidance: number;
}

interface Balance {
  credits: number;
  plan: string;
  validity: string;
}

export default function FaceGenerator() {
  const [selectedAPI, setSelectedAPI] = useState("hairstyle");
  const [selfieImage, setSelfieImage] = useState<string | null>(
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face"
  );
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    strength: 0.85,
    steps: 25,
    guidance: 7.5,
  });
  const [textPrompt, setTextPrompt] = useState("");
  const [balance, setBalance] = useState<Balance>({
    credits: 0,
    plan: "Starter",
    validity: "Lifetime",
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [apiPassword, setApiPassword] = useState("");
  const [isAPIConfigUnlocked, setIsAPIConfigUnlocked] = useState(false);
  const [apiKey, setApiKey] = useState(
    "09c7163908b945799248c0820c5311bc_c5f61635e3fb430883fa2763f012203e_andoraitools"
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleImageInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [dividerPosition, setDividerPosition] = useState(50); // Position as percentage from left
  const [isDragging, setIsDragging] = useState(false);
  const [isStyleImageDragOver, setIsStyleImageDragOver] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("blackwhite");
  const [showFullTemplate, setShowFullTemplate] = useState(false);

  const apiOptions: APIOption[] = [
    {
      id: "hairstyle",
      name: "AI Hairstyle",
      description: "Try new hairstyles instantly - from bob cuts to afros",
      endpoint: "/external/api/v1/hairstyle",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps"],
      defaultSettings: { strength: 0.8, steps: 20, guidance: 7.5 },
      settingsRanges: {
        strength: { min: 0.3, max: 1.0, step: 0.05 },
        steps: { min: 10, max: 30, step: 1 },
      },
      promptPlaceholder: "e.g., curly bob, long wavy hair, pixie cut",
    },
    {
      id: "haircolor",
      name: "Hair Color Changer",
      description: "Transform your hair color - blonde to pink unicorn ✨",
      endpoint: "/external/api/v2/haircolor/",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps"],
      defaultSettings: { strength: 0.75, steps: 25, guidance: 7.5 },
      settingsRanges: {
        strength: { min: 0.4, max: 1.0, step: 0.05 },
        steps: { min: 15, max: 35, step: 1 },
      },
      promptPlaceholder: "e.g., platinum blonde, rainbow colors, natural brown",
    },
    {
      id: "outfit",
      name: "AI Outfit",
      description: "Create complete new looks with AI styling",
      endpoint: "/external/api/v1/outfit",
      cost: 1,
      previewImage: "/image.png",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps", "guidance"],
      defaultSettings: { strength: 0.85, steps: 30, guidance: 8.0 },
      settingsRanges: {
        strength: { min: 0.5, max: 1.0, step: 0.05 },
        steps: { min: 20, max: 50, step: 1 },
        guidance: { min: 5, max: 15, step: 0.5 },
      },
      promptPlaceholder:
        "e.g., business suit, casual streetwear, elegant dress",
    },
    {
      id: "virtualtryon",
      name: "Virtual Outfit Try On",
      description: "Try on virtual clothes - test jackets and shirts",
      endpoint: "/external/api/v2/aivirtualtryon",
      cost: 2,
      previewImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      requiresStyleImage: true,
      supportedSettings: ["strength"],
      defaultSettings: { strength: 0.9, steps: 25, guidance: 7.5 },
      settingsRanges: {
        strength: { min: 0.6, max: 1.0, step: 0.05 },
      },
    },
    {
      id: "faceswap",
      name: "AI Face Swap",
      description: "Swap faces like in memes, but professionally",
      endpoint: "/external/api/v1/face-swap",
      cost: 1, // Changed from 0.5 to 0
      previewImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      requiresStyleImage: true,
      supportedSettings: ["strength"],
      defaultSettings: { strength: 0.95, steps: 25, guidance: 7.5 },
      settingsRanges: {
        strength: { min: 0.7, max: 1.0, step: 0.05 },
      },
    },
    {
      id: "portrait",
      name: "AI Portrait",
      description: "Create beautiful studio-style portraits",
      endpoint: "/external/api/v1/portrait",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps", "guidance"],
      defaultSettings: { strength: 0.7, steps: 35, guidance: 9.0 },
      settingsRanges: {
        strength: { min: 0.3, max: 0.9, step: 0.05 },
        steps: { min: 25, max: 50, step: 1 },
        guidance: { min: 6, max: 12, step: 0.5 },
      },
      promptPlaceholder:
        "e.g., professional headshot, artistic portrait, studio lighting",
    },
    {
      id: "replace",
      name: "AI Replace",
      description: "Replace backgrounds, accessories, and elements",
      endpoint: "/external/api/v1/replace",
      cost: 1,
      previewImage:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
      requiresStyleImage: true,
      requiresTextPrompt: true,
      supportedSettings: ["strength", "guidance"],
      defaultSettings: { strength: 0.8, steps: 25, guidance: 10.0 },
      settingsRanges: {
        strength: { min: 0.5, max: 1.0, step: 0.05 },
        guidance: { min: 7, max: 15, step: 0.5 },
      },
      promptPlaceholder:
        "e.g., tropical beach background, modern office, mountain landscape",
    },
    {
      id: "cartoon",
      name: "AI Cartoon Generator",
      description: "Transform photos into cartoon characters",
      endpoint: "/external/api/v1/cartoon",
      cost: 1,
      previewImage: "/cartoon.png",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps", "guidance"],
      defaultSettings: { strength: 0.85, steps: 25, guidance: 8.5 },
      settingsRanges: {
        strength: { min: 0.6, max: 1.0, step: 0.05 },
        steps: { min: 15, max: 40, step: 1 },
        guidance: { min: 6, max: 12, step: 0.5 },
      },
      promptPlaceholder: "e.g., Disney style, anime character, 3D cartoon",
    },
    {
      id: "avatar",
      name: "AI Avatar Generator",
      description: "Create avatars in gaming, anime, or business styles",
      endpoint: "/external/api/v1/avatar",
      cost: 1,
      previewImage: "/avatar.png",
      requiresTextPrompt: true,
      supportedSettings: ["strength", "steps", "guidance"],
      defaultSettings: { strength: 0.8, steps: 30, guidance: 8.0 },
      settingsRanges: {
        strength: { min: 0.5, max: 1.0, step: 0.05 },
        steps: { min: 20, max: 40, step: 1 },
        guidance: { min: 6, max: 12, step: 0.5 },
      },
      promptPlaceholder:
        "e.g., gaming avatar, professional headshot, anime style",
    },
  ];

  const selectedAPIConfig =
    apiOptions.find((api) => api.id === selectedAPI) || apiOptions[0];

  const templateOptions = [
    { id: "blackwhite", name: "Black & White", filter: "grayscale(100%)" },
    { id: "blur", name: "Blur Effect", filter: "blur(3px)" },
    { id: "sepia", name: "Vintage Sepia", filter: "sepia(100%) contrast(1.2)" },
    {
      id: "contrast",
      name: "High Contrast",
      filter: "contrast(150%) brightness(1.1)",
    },
    {
      id: "vintage",
      name: "Vintage Film",
      filter: "sepia(50%) contrast(1.3) brightness(0.9) hue-rotate(15deg)",
    },
    {
      id: "cold",
      name: "Cold Tone",
      filter: "hue-rotate(180deg) saturate(1.2)",
    },
  ];

  const selectedTemplateConfig =
    templateOptions.find((t) => t.id === selectedTemplate) ||
    templateOptions[0];

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

  const handleStyleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setStyleImage(imageUrl);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const handleAPIChange = (apiId: string) => {
    const apiConfig = apiOptions.find((api) => api.id === apiId);
    if (apiConfig) {
      setSelectedAPI(apiId);
      setSettings((prev) => ({
        ...prev,
        ...apiConfig.defaultSettings,
      }));
      setStyleImage(null);
    }
  };

  const validateAndSanitizePrompt = (
    prompt: string
  ): { isValid: boolean; sanitized: string; error?: string } => {
    if (!prompt.trim()) {
      return {
        isValid: false,
        sanitized: "",
        error: "Text prompt cannot be empty",
      };
    }

    // Remove or replace problematic characters
    const sanitized = prompt
      .trim()
      // Remove quotes that can break JSON
      .replace(/["""'']/g, "")
      // Replace Cyrillic and other non-Latin characters with transliteration or remove them
      .replace(/[а-яё]/gi, "") // Remove Cyrillic characters
      .replace(/[^\w\s\-.,!?]/g, "") // Keep only alphanumeric, spaces, and basic punctuation
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      .trim();

    // Check length limits
    if (sanitized.length < 3) {
      return {
        isValid: false,
        sanitized,
        error: "Text prompt must be at least 3 characters long",
      };
    }

    if (sanitized.length > 200) {
      return {
        isValid: false,
        sanitized,
        error: "Text prompt must be less than 200 characters",
      };
    }

    // Check for empty result after sanitization
    if (!sanitized) {
      return {
        isValid: false,
        sanitized: "",
        error:
          "Text prompt contains only unsupported characters. Please use English letters and basic punctuation.",
      };
    }

    return { isValid: true, sanitized };
  };

  const generateFaceWithLightX = async (file: File, styleFile?: File) => {
    let validatedPrompt = "";
    if (selectedAPIConfig.requiresTextPrompt && textPrompt) {
      const validation = validateAndSanitizePrompt(textPrompt);
      if (!validation.isValid) {
        alert(`Text Prompt Error: ${validation.error}`);
        return;
      }
      validatedPrompt = validation.sanitized;
      console.log("[v0] Original prompt:", textPrompt);
      console.log("[v0] Sanitized prompt:", validatedPrompt);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "generate_face");
    formData.append("apiType", selectedAPI);
    formData.append("template", selectedAPIConfig.name);
    formData.append("style", "realistic");
    formData.append("strength", settings.strength.toString());
    if (selectedAPIConfig.requiresTextPrompt && validatedPrompt) {
      formData.append("textPrompt", validatedPrompt);
    }
    if (styleFile && selectedAPIConfig.requiresStyleImage) {
      formData.append("styleImage", styleFile);
    }

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

    if (selectedAPIConfig.requiresStyleImage && !styleImage) {
      alert(`Please upload a style image for ${selectedAPIConfig.name}`);
      return;
    }

    if (selfieImage.startsWith("data:")) {
      const response = await fetch(selfieImage);
      const blob = await response.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      let styleFile: File | undefined;
      if (styleImage && styleImage.startsWith("data:")) {
        const styleResponse = await fetch(styleImage);
        const styleBlob = await styleResponse.blob();
        styleFile = new File([styleBlob], "style.jpg", { type: "image/jpeg" });
      }

      await generateFaceWithLightX(file, styleFile);
    } else {
      alert("Please upload a new selfie for generation");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateDividerPosition(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateDividerPosition(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateDividerPosition = (e: React.MouseEvent) => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setDividerPosition(percentage);
    }
  };

  const handleStyleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleImageDragOver(true);
  };

  const handleStyleImageDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleImageDragOver(true);
  };

  const handleStyleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleImageDragOver(false);
  };

  const handleStyleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsStyleImageDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          setStyleImage(imageUrl);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handlePreviewClick = () => {
    if (selfieImage) {
      setShowFullTemplate(!showFullTemplate);
    }
  };

  const handleAPIPasswordSubmit = () => {
    if (apiPassword === "parol2025") {
      setIsAPIConfigUnlocked(true);
      setApiPassword("");
      setShowAPIConfig(false);
    } else {
      alert("Неверный пароль!");
      setApiPassword("");
    }
  };

  const handleAPIKeyUpdate = () => {
    // Here you would typically save the API key to your backend or local storage
    alert("API ключ обновлен!");
    setShowAPIConfig(false);
    setIsAPIConfigUnlocked(false);
  };

  const downloadGeneratedImage = async () => {
    if (!generatedImage) {
      alert("No generated image to download");
      return;
    }

    try {
      console.log("[v0] Starting image download...");
      const response = await fetch(generatedImage);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-generated-${selectedAPIConfig.name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      console.log("[v0] Image downloaded successfully");
    } catch (error) {
      console.error("[v0] Download error:", error);
      alert("Error downloading image. Please try again.");
    }
  };

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const formData = new FormData();
      formData.append("action", "check_balance");
      // Add a dummy file since the API expects it
      const dummyFile = new File([""], "dummy.txt", { type: "text/plain" });
      formData.append("file", dummyFile);

      const response = await fetch("/api/lightx", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.balance !== undefined) {
          // Handle both old format (number) and new format (object)
          if (typeof data.balance === "number") {
            setBalance({
              credits: data.balance,
              plan: "Starter",
              validity: "Lifetime",
            });
          } else {
            setBalance(data.balance);
          }
          if (data.simulated) {
            console.log("[v0] Using simulated balance:", data.message);
          }
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-black text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-center lg:text-left">
              AI Face Generator Studio
            </h1>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto lg:w-auto">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowAPIConfig(true)}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm lg:text-base"
                >
                  ⚙️ API Settings
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  className="hidden"
                />
                <input
                  ref={styleImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStyleImageUpload}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm lg:text-base"
                >
                  📷 Upload Selfie
                </Button>

                {selectedAPIConfig.requiresStyleImage && (
                  <Button
                    onClick={() => styleImageInputRef.current?.click()}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm lg:text-base"
                  >
                    🎨 Style Image
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAPIConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              API Configuration
            </h3>

            {!isAPIConfigUnlocked ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Введите пароль для доступа к настройкам API:
                </label>
                <input
                  type="password"
                  value={apiPassword}
                  onChange={(e) => setApiPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleAPIPasswordSubmit()
                  }
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAPIPasswordSubmit}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl"
                  >
                    Войти
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAPIConfig(false);
                      setApiPassword("");
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-xl"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  NEXT_LIGHTX_API_KEY:
                </label>
                <textarea
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4 h-20 text-xs font-mono"
                  placeholder="Вставьте ваш API ключ здесь..."
                />
                <div className="text-xs text-gray-600 mb-4">
                  <strong>Где добавить API ключ:</strong>
                  <br />
                  1. В файле .env.local: NEXT_LIGHTX_API_KEY=ваш_ключ
                  <br />
                  2. В Vercel: Project Settings → Environment Variables
                  <br />
                  3. В настройках хостинга как переменная окружения
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAPIKeyUpdate}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-xl"
                  >
                    Сохранить
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAPIConfig(false);
                      setIsAPIConfigUnlocked(false);
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 rounded-xl"
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 xl:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Card className="p-3 sm:p-4 lg:p-6 xl:p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3">
              <span className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
              Preview
            </h2>

            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-purple-50 to-pink-100 rounded-2xl">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3">
                Template Effect:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-1 sm:gap-2">
                {templateOptions.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`px-2 sm:px-3 py-1 sm:py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                      selectedTemplate === template.id
                        ? "bg-purple-500 text-white shadow-lg"
                        : "bg-white text-purple-600 hover:bg-purple-100"
                    }`}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                <label className="text-xs sm:text-sm font-bold text-gray-800">
                  Divider Position
                </label>
                <input
                  type="number"
                  value={Math.round(dividerPosition)}
                  onChange={(e) =>
                    setDividerPosition(
                      Math.max(0, Math.min(100, Number(e.target.value)))
                    )
                  }
                  className="w-14 sm:w-16 px-1 sm:px-2 py-1 text-xs sm:text-sm border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                />
              </div>
              <Slider
                value={[dividerPosition]}
                onValueChange={([value]) => setDividerPosition(value)}
                max={100}
                min={0}
                step={1}
              />
            </div>

            <div
              ref={previewRef}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner cursor-crosshair touch-manipulation"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handlePreviewClick}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                setDividerPosition(Math.max(0, Math.min(100, percentage)));
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const percentage = (x / rect.width) * 100;
                setDividerPosition(Math.max(0, Math.min(100, percentage)));
              }}
            >
              {selfieImage ? (
                <>
                  <div className="relative w-full h-full">
                    {showFullTemplate ? (
                      <div className="relative w-full h-full">
                        <img
                          src={selfieImage || "/placeholder.svg"}
                          alt="Full Template"
                          className="w-full h-full object-cover"
                          style={{ filter: selectedTemplateConfig.filter }}
                        />
                        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-bold">
                          {selectedTemplateConfig.name}
                        </div>
                        <div className="absolute bottom-4 right-4 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-bold cursor-pointer">
                          Click to return
                        </div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={selfieImage || "/placeholder.svg"}
                          alt="Template"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            clipPath: `polygon(0 0, ${dividerPosition}% 0, ${dividerPosition}% 100%, 0 100%)`,
                            filter: selectedTemplateConfig.filter,
                          }}
                        />

                        <img
                          src={generatedImage || selfieImage}
                          alt="Enhanced"
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            clipPath: `polygon(${dividerPosition}% 0, 100% 0, 100% 100%, ${dividerPosition}% 100%)`,
                          }}
                        />

                        <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-bold">
                          {selectedTemplateConfig.name}
                        </div>
                        <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-bold">
                          {generatedImage ? "AI Enhanced" : "Original"}
                        </div>

                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-500/80 text-white text-xs px-3 py-1 rounded-full font-bold">
                          Click to view full template
                        </div>
                      </>
                    )}

                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <div className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 text-center shadow-2xl mx-4">
                          <div className="relative mb-4 sm:mb-6">
                            <div className="animate-spin w-12 sm:w-16 h-12 sm:h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
                            <div
                              className="animate-spin w-8 sm:w-12 h-8 sm:h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"
                              style={{
                                animationDirection: "reverse",
                                animationDuration: "1.5s",
                              }}
                            ></div>
                            <div
                              className="animate-spin w-6 sm:w-8 h-6 sm:h-8 border-4 border-pink-200 border-t-pink-600 rounded-full mx-auto absolute top-3 sm:top-4 left-1/2 transform -translate-x-1/2"
                              style={{ animationDuration: "2s" }}
                            ></div>
                          </div>

                          <div className="text-base sm:text-lg font-bold text-gray-800 mb-2">
                            Generating Magic ✨
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 mb-4">
                            Creating your {selectedAPIConfig.name.toLowerCase()}
                            ...
                          </div>

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
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500 px-4">
                    <div className="text-4xl sm:text-6xl mb-4">📷</div>
                    <div className="text-base sm:text-lg font-semibold">
                      Upload a selfie to get started
                    </div>
                    <div className="text-xs sm:text-sm mt-2">
                      Choose from 10 amazing AI transformations
                    </div>
                  </div>
                </div>
              )}
            </div>
            {generatedImage && (
              <div className="mt-4 space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-base"
                  onClick={downloadGeneratedImage}
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download AI Generated Image
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Click to save your AI-enhanced image
                </p>
              </div>
            )}
          </Card>

          <Card className="p-3 sm:p-4 lg:p-6 xl:p-8 bg-white/90 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-gray-800 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2 sm:gap-3">
              <span className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></span>
              AI Transformation Studio
            </h2>

            <div className="mb-4 sm:mb-6 lg:mb-8">
              <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4">
                Choose AI Transformation:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 sm:gap-3 max-h-48 sm:max-h-60 lg:max-h-80 overflow-y-auto p-1 sm:p-2">
                {apiOptions.map((api) => {
                  const isLocked = !isAPIConfigUnlocked && api.cost > 0;

                  if (isLocked) {
                    return (
                      <div
                        key={`locked-${api.id}`}
                        className="relative p-2 sm:p-3 lg:p-4 rounded-2xl border-2 border-gray-300 bg-gray-100"
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl z-10">
                          <div className="bg-white rounded-full p-1 sm:p-2 shadow-lg">
                            <svg
                              className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                        <img
                          src={api.previewImage || "/placeholder.svg"}
                          alt={api.name}
                          className="w-full h-12 sm:h-16 lg:h-20 object-cover rounded-xl mb-2 sm:mb-3 grayscale"
                        />
                        <h3 className="font-bold text-xs sm:text-sm text-gray-500 mb-1">
                          {api.name}
                        </h3>
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                          {api.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-400">
                            ₽{convertToRubles(api.cost * 0.01)}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={api.id}
                      onClick={() => handleAPIChange(api.id)}
                      className={`cursor-pointer p-2 sm:p-3 lg:p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${
                        selectedAPI === api.id
                          ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg"
                          : "border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md"
                      }`}
                    >
                      <img
                        src={api.previewImage || "/placeholder.svg"}
                        alt={api.name}
                        className="w-full h-12 sm:h-16 lg:h-20 object-cover rounded-xl mb-2 sm:mb-3"
                      />
                      <h3 className="font-bold text-xs sm:text-sm text-gray-800 mb-1">
                        {api.name}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {api.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600">
                          {api.cost === 0
                            ? "Free"
                            : `₽${convertToRubles(api.cost * 0.01)}`}
                        </span>
                        {selectedAPI === api.id && (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-2 h-2 sm:w-3 sm:h-3 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedAPIConfig.requiresTextPrompt && (
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4">
                  Text Prompt:
                </label>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl">
                  <input
                    type="text"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder={
                      selectedAPIConfig.promptPlaceholder ||
                      "Describe what you want..."
                    }
                    className="w-full px-2 py-1 sm:px-3 sm:py-2 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-xs sm:text-sm"
                  />
                  {textPrompt &&
                    (() => {
                      const validation = validateAndSanitizePrompt(textPrompt);
                      if (!validation.isValid) {
                        return (
                          <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                            ⚠️ {validation.error}
                          </div>
                        );
                      } else if (validation.sanitized !== textPrompt.trim()) {
                        return (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                            ℹ️ Prompt will be cleaned: "{validation.sanitized}"
                          </div>
                        );
                      }
                      return null;
                    })()}
                </div>
              </div>
            )}

            {selectedAPIConfig.requiresStyleImage && (
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-3 sm:mb-4">
                  Style Image Preview:
                </label>
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl">
                  {styleImage ? (
                    <div className="relative">
                      <img
                        src={styleImage || "/placeholder.svg"}
                        alt="Style preview"
                        className="w-full h-24 sm:h-32 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => setStyleImage(null)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-center h-24 sm:h-32 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
                        isStyleImageDragOver
                          ? "border-orange-500 bg-orange-100 scale-105"
                          : "border-orange-300 hover:border-orange-400 hover:bg-orange-75"
                      }`}
                      onDragOver={handleStyleImageDragOver}
                      onDragEnter={handleStyleImageDragEnter}
                      onDragLeave={handleStyleImageDragLeave}
                      onDrop={handleStyleImageDrop}
                      onClick={() => styleImageInputRef.current?.click()}
                    >
                      <div className="text-center text-orange-600">
                        <div className="text-xl sm:text-2xl mb-1 sm:mb-2">
                          {isStyleImageDragOver ? "📤" : "🎨"}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold">
                          {isStyleImageDragOver
                            ? "Drop image here"
                            : "Upload or drag & drop style image"}
                        </div>
                        <div className="text-xs">
                          Required for {selectedAPIConfig.name}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 sm:space-y-4 lg:space-y-6 mb-4 sm:mb-6 lg:mb-8">
              <h3 className="font-bold text-gray-800 flex items-center gap-1 sm:gap-2">
                <span className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></span>
                Settings
              </h3>

              {selectedAPIConfig.supportedSettings.includes("strength") && (
                <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-800">
                      Strength
                    </label>
                    <span className="text-sm font-bold text-indigo-700 bg-white px-2 py-1 rounded-full">
                      {settings.strength}
                    </span>
                  </div>
                  <Slider
                    value={[settings.strength]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, strength: value }))
                    }
                    max={selectedAPIConfig.settingsRanges.strength?.max || 1}
                    min={selectedAPIConfig.settingsRanges.strength?.min || 0}
                    step={
                      selectedAPIConfig.settingsRanges.strength?.step || 0.05
                    }
                  />
                </div>
              )}

              {selectedAPIConfig.supportedSettings.includes("steps") && (
                <div className="p-2 sm:p-3 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-800">
                      Steps
                    </label>
                    <span className="text-sm font-bold text-purple-700 bg-white px-2 py-1 rounded-full">
                      {settings.steps}
                    </span>
                  </div>
                  <Slider
                    value={[settings.steps]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, steps: value }))
                    }
                    max={selectedAPIConfig.settingsRanges.steps?.max || 50}
                    min={selectedAPIConfig.settingsRanges.steps?.min || 1}
                    step={selectedAPIConfig.settingsRanges.steps?.step || 1}
                  />
                </div>
              )}

              {selectedAPIConfig.supportedSettings.includes("guidance") && (
                <div className="p-2 sm:p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs sm:text-sm font-bold text-gray-800">
                      Guidance
                    </label>
                    <span className="text-sm font-bold text-green-700 bg-white px-2 py-1 rounded-full">
                      {settings.guidance}
                    </span>
                  </div>
                  <Slider
                    value={[settings.guidance]}
                    onValueChange={([value]) =>
                      setSettings((prev) => ({ ...prev, guidance: value }))
                    }
                    max={selectedAPIConfig.settingsRanges.guidance?.max || 20}
                    min={selectedAPIConfig.settingsRanges.guidance?.min || 1}
                    step={
                      selectedAPIConfig.settingsRanges.guidance?.step || 0.5
                    }
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-black py-3 sm:py-4 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 text-sm sm:text-base"
              onClick={handleApplyGeneration}
              disabled={isGenerating || !selfieImage}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-3 border-white border-t-transparent rounded-full mx-auto"></div>
                  <span className="text-xs sm:text-sm">
                    Generating Magic...
                  </span>
                </div>
              ) : (
                <span className="text-xs sm:text-sm">
                  ✨ Transform with {selectedAPIConfig.name} ✨
                </span>
              )}
            </Button>

            <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-700">Selected API:</span>
                <span className="font-bold text-indigo-600">
                  {selectedAPIConfig.name}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="font-bold text-gray-700">Cost:</span>
                <span className="font-bold text-green-600">
                  {selectedAPIConfig.cost === 0
                    ? "FREE"
                    : `₽${convertToRubles(selectedAPIConfig.cost * 0.01)}`}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
