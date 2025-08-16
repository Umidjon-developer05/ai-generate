"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

interface APIConfig {
  id: string;
  name: string;
  apiKey: string;
  balance: number;
  generationCost: number;
  templates: string[];
  settings: {
    strength: number;
    steps: number;
    guidance: number;
  };
}

interface Column {
  id: string;
  apiConfig: APIConfig;
  selectedTemplate: string;
  selfieImage: string | null;
  showLeftSide: boolean;
  dividerPosition: number;
}

export default function FaceGenerator() {
  const [hideLeftSide, setHideLeftSide] = useState(false);
  const [singleMode, setSingleMode] = useState(true);
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "1",
      apiConfig: {
        id: "lightx",
        name: "LightX Editor",
        apiKey: "hidden",
        balance: 25.0,
        generationCost: 0.04,
        templates: [
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face",
        ],
        settings: { strength: 0.85, steps: 25, guidance: 7.5 },
      },
      selectedTemplate: "LightX шаблон",
      selfieImage:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face",
      showLeftSide: true,
      dividerPosition: 50,
    },
    {
      id: "2",
      apiConfig: {
        id: "stable-diffusion",
        name: "Stable Diffusion",
        apiKey: "скрыт",
        balance: 15.5,
        generationCost: 0.02,
        templates: [
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=120&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=120&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=120&fit=crop",
          "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=120&h=120&fit=crop",
        ],
        settings: { strength: 0.8, steps: 20, guidance: 7.5 },
      },
      selectedTemplate: "Аниме стиль",
      selfieImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
      showLeftSide: true,
      dividerPosition: 50,
    },
    {
      id: "3",
      apiConfig: {
        id: "midjourney",
        name: "Midjourney",
        apiKey: "скрыт",
        balance: 8.25,
        generationCost: 0.05,
        templates: [
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face",
        ],
        settings: { strength: 0.7, steps: 25, guidance: 8.0 },
      },
      selectedTemplate: "Реалистичный портрет",
      selfieImage:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face",
      showLeftSide: true,
      dividerPosition: 50,
    },
    {
      id: "4",
      apiConfig: {
        id: "dalle",
        name: "DALL-E 3",
        apiKey: "скрыт",
        balance: 12.75,
        generationCost: 0.08,
        templates: [
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face",
        ],
        settings: { strength: 0.9, steps: 30, guidance: 6.0 },
      },
      selectedTemplate: "Мультяшный стиль",
      selfieImage:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=300&fit=crop&crop=face",
      showLeftSide: true,
      dividerPosition: 50,
    },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [generatedImages, setGeneratedImages] = useState<{
    [key: string]: string;
  }>({});

  const generateFaceWithLightX = async (
    file: File,
    columnId: string,
    template: string,
    settings: any
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "generate_face");
    formData.append("template", template);
    formData.append("style", "realistic");
    formData.append("strength", settings.strength.toString());

    setIsGenerating((prev) => ({ ...prev, [columnId]: true }));

    try {
      const res = await fetch("/api/lightx", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      console.log("[v0] API Response Status:", res.status, res.ok);
      console.log("[v0] API Response Data:", JSON.stringify(result, null, 2));
      console.log(
        "[v0] Checking conditions - success:",
        result.success,
        "imageUrl:",
        result.imageUrl
      );

      if (res.ok && result.success && result.imageUrl) {
        setGeneratedImages((prev) => ({
          ...prev,
          [columnId]: result.imageUrl,
        }));

        setColumns((prev) =>
          prev.map((col) =>
            col.id === columnId ? { ...col, selfieImage: result.imageUrl } : col
          )
        );

        console.log("[v0] Face generated successfully:", result.imageUrl);
      } else {
        console.error(
          "[v0] Face generation failed:",
          result.error || "Unknown error"
        );
        console.error(
          "[v0] Failed conditions - res.ok:",
          res.ok,
          "result.success:",
          result.success,
          "result.imageUrl:",
          result.imageUrl
        );
        alert(`Ошибка генерации: ${result.error || "Неизвестная ошибка"}`);
      }
    } catch (error) {
      console.error("[v0] Face generation error:", error);
      alert("Ошибка при генерации лица");
    } finally {
      setIsGenerating((prev) => ({ ...prev, [columnId]: false }));
    }
  };

  const handleSelfieUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("[v0] File selected:", file.name, file.size, file.type);

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        console.log("[v0] Image loaded, URL length:", imageUrl.length);

        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            selfieImage: imageUrl,
          }))
        );
        console.log("[v0] Columns updated with new selfie");
      };

      reader.onerror = (e) => {
        console.error("[v0] FileReader error:", e);
      };

      reader.readAsDataURL(file);
    } else {
      console.log("[v0] No file selected");
    }

    event.target.value = "";
  };

  const handleSelfieClick = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, showLeftSide: !col.showLeftSide } : col
      )
    );
  };

  const handleTemplateSelect = (columnId: string, template: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, selectedTemplate: template } : col
      )
    );
  };

  const handleDividerMove = (columnId: string, position: number) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, dividerPosition: position } : col
      )
    );
  };

  const handleApplyGeneration = async (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column || !column.selfieImage) {
      alert("Сначала загрузите селфи");
      return;
    }

    if (column.selfieImage.startsWith("data:")) {
      const response = await fetch(column.selfieImage);
      const blob = await response.blob();
      const file = new File([blob], `selfie-${columnId}.jpg`, {
        type: "image/jpeg",
      });

      await generateFaceWithLightX(
        file,
        columnId,
        column.selectedTemplate,
        column.apiConfig.settings
      );
    } else {
      alert("Загрузите новое селфи для генерации");
    }
  };

  const formatDateTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}${now.getFullYear().toString().slice(-2)}`;
  };

  const convertToRubles = (dollars: number) => {
    return (dollars * 95).toFixed(0); // 1 USD ≈ 95 RUB
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header Controls */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={() => setHideLeftSide(!hideLeftSide)}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              {hideLeftSide
                ? "Показать левую часть с эффектом"
                : "Скрыть левую часть с эффектом"}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSelfieUpload}
              className="hidden"
            />

            <Button
              onClick={() => {
                console.log("[v0] Upload button clicked");
                fileInputRef.current?.click();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Загрузить новое селфи
            </Button>

            <Button
              variant="secondary"
              className="bg-green-100 hover:bg-green-200 text-green-800"
            >
              Применить везде
            </Button>

            <Button
              onClick={() => setSingleMode(!singleMode)}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              {singleMode ? "Многоколоночный режим" : "Одноколоночный режим"}
            </Button>
          </div>
        </div>
      </div>

      {/* Top Section - 20% height with selfie previews */}
      <div className="h-[20vh] bg-white border-b-4 border-red-500">
        <div className="h-full flex overflow-x-auto">
          {columns
            .slice(0, singleMode ? 1 : Math.min(columns.length, 6))
            .map((column, index) => (
              <div
                key={column.id}
                className="relative flex-shrink-0 h-full"
                style={{
                  width: singleMode ? "100%" : "25%",
                  minWidth: singleMode ? "100%" : "300px",
                  borderRight:
                    !singleMode && index < Math.min(columns.length, 6) - 1
                      ? "3px solid #ef4444"
                      : "none",
                }}
              >
                {/* Column header */}
                <div className="absolute bottom-2 left-2 right-2 z-20">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 text-center">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {column.selectedTemplate}
                    </h3>
                  </div>
                </div>

                {column.selfieImage && (
                  <div
                    className="relative h-full cursor-pointer overflow-hidden"
                    onClick={() => handleSelfieClick(column.id)}
                  >
                    {/* Original image (right side) */}
                    <div
                      className="absolute top-0 right-0 h-full bg-cover bg-center bg-gray-200"
                      style={{
                        backgroundImage: `url(${
                          generatedImages[column.id] || column.selfieImage
                        })`,
                        width: `${100 - column.dividerPosition}%`,
                      }}
                    />

                    {/* Template effect (left side) */}
                    {!hideLeftSide && column.showLeftSide && (
                      <div
                        className="absolute top-0 left-0 h-full bg-cover bg-center filter grayscale opacity-60 bg-gray-200"
                        style={{
                          backgroundImage: `url(${column.selfieImage})`,
                          width: `${column.dividerPosition}%`,
                        }}
                      />
                    )}

                    {/* Divider line */}
                    {!hideLeftSide && (
                      <div
                        className="absolute top-0 h-full w-1 bg-red-500 cursor-ew-resize shadow-lg z-10"
                        style={{ left: `${column.dividerPosition}%` }}
                        onMouseDown={(e) => {
                          const startX = e.clientX;
                          const startPosition = column.dividerPosition;
                          const rect =
                            e.currentTarget.parentElement?.getBoundingClientRect();

                          const handleMouseMove = (e: MouseEvent) => {
                            if (rect) {
                              const newPosition = Math.max(
                                0,
                                Math.min(
                                  100,
                                  startPosition +
                                    ((e.clientX - startX) / rect.width) * 100
                                )
                              );
                              handleDividerMove(column.id, newPosition);
                            }
                          };

                          const handleMouseUp = () => {
                            document.removeEventListener(
                              "mousemove",
                              handleMouseMove
                            );
                            document.removeEventListener(
                              "mouseup",
                              handleMouseUp
                            );
                          };

                          document.addEventListener(
                            "mousemove",
                            handleMouseMove
                          );
                          document.addEventListener("mouseup", handleMouseUp);
                        }}
                      />
                    )}

                    {/* Fixed red comparison line through center of image */}
                    <div className="absolute top-0 h-full w-1 bg-red-600 shadow-2xl z-20 left-1/2 transform -translate-x-1/2">
                      <div className="absolute inset-0 bg-gradient-to-b from-red-500 via-red-600 to-red-500 shadow-lg"></div>
                    </div>

                    {/* Loading overlay */}
                    {isGenerating[column.id] && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                        <div className="bg-white rounded-lg p-4 text-center">
                          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                          <div className="text-sm font-medium">
                            Генерация лица...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Placeholder when no image */}
                {!column.selfieImage && (
                  <div className="h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📷</div>
                      <div className="text-sm">Загрузите селфи</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Bottom Section - 80% height with settings and templates */}
      <div className="h-[80vh] bg-gradient-to-br from-slate-50 to-gray-100 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div
            className={`grid gap-8 ${
              singleMode
                ? "grid-cols-1 max-w-2xl mx-auto"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {columns.slice(0, singleMode ? 1 : 4).map((column) => (
              <div key={column.id} className="space-y-6">
                {/* API Settings Card */}
                <Card className="p-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 shadow-2xl border-0 rounded-3xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 backdrop-blur-sm border border-white/20">
                  <div className="space-y-6">
                    <div className="border-b border-gradient-to-r from-blue-200 to-purple-200 pb-6">
                      <h3 className="text-2xl font-black text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text mb-4 tracking-tight">
                        {column.selectedTemplate}
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200/50 shadow-sm">
                          <span className="font-bold text-gray-800 text-sm">
                            API:
                          </span>
                          <span className="text-blue-800 font-black text-sm px-4 py-2 bg-gradient-to-r from-blue-200 to-blue-300 rounded-full shadow-md border border-blue-200/50">
                            {column.apiConfig.name}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 shadow-sm">
                          <span className="font-bold text-gray-800 text-sm">
                            Ключ:
                          </span>
                          <span className="text-gray-600 text-sm font-medium">
                            скрыт
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-100 rounded-2xl border border-green-200/50 shadow-sm">
                          <span className="font-bold text-gray-800 text-sm">
                            Баланс:
                          </span>
                          <span className="text-green-800 font-black text-xl tracking-tight">
                            ₽{convertToRubles(column.apiConfig.balance)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-red-100 rounded-2xl border border-orange-200/50 shadow-sm">
                          <span className="font-bold text-gray-800 text-sm">
                            Стоимость:
                          </span>
                          <span className="text-orange-800 font-black text-lg">
                            ₽{convertToRubles(column.apiConfig.generationCost)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-black text-gray-900 text-xl flex items-center gap-3">
                        <span className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg"></span>
                        Настройки по умолчанию
                      </h4>

                      <div className="space-y-6">
                        <div className="p-5 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl border border-blue-200/50 shadow-lg">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-black text-gray-900">
                              Сила
                            </label>
                            <span className="text-xl font-black text-blue-700 bg-white px-4 py-2 rounded-full shadow-md border border-blue-200">
                              {column.apiConfig.settings.strength}
                            </span>
                          </div>
                          <Slider
                            value={[column.apiConfig.settings.strength]}
                            onValueChange={([value]) => {
                              setColumns((prev) =>
                                prev.map((col) =>
                                  col.id === column.id
                                    ? {
                                        ...col,
                                        apiConfig: {
                                          ...col.apiConfig,
                                          settings: {
                                            ...col.apiConfig.settings,
                                            strength: value,
                                          },
                                        },
                                      }
                                    : col
                                )
                              );
                            }}
                            max={1}
                            min={0}
                            step={0.05}
                            className="mt-3"
                          />
                        </div>

                        <div className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-2xl border border-purple-200/50 shadow-lg">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-black text-gray-900">
                              Шаги
                            </label>
                            <span className="text-xl font-black text-purple-700 bg-white px-4 py-2 rounded-full shadow-md border border-purple-200">
                              {column.apiConfig.settings.steps}
                            </span>
                          </div>
                          <Slider
                            value={[column.apiConfig.settings.steps]}
                            onValueChange={([value]) => {
                              setColumns((prev) =>
                                prev.map((col) =>
                                  col.id === column.id
                                    ? {
                                        ...col,
                                        apiConfig: {
                                          ...col.apiConfig,
                                          settings: {
                                            ...col.apiConfig.settings,
                                            steps: value,
                                          },
                                        },
                                      }
                                    : col
                                )
                              );
                            }}
                            max={50}
                            min={1}
                            step={1}
                            className="mt-3"
                          />
                        </div>

                        <div className="p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 rounded-2xl border border-green-200/50 shadow-lg">
                          <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-black text-gray-900">
                              Руководство
                            </label>
                            <span className="text-xl font-black text-green-700 bg-white px-4 py-2 rounded-full shadow-md border border-green-200">
                              {column.apiConfig.settings.guidance}
                            </span>
                          </div>
                          <Slider
                            value={[column.apiConfig.settings.guidance]}
                            onValueChange={([value]) => {
                              setColumns((prev) =>
                                prev.map((col) =>
                                  col.id === column.id
                                    ? {
                                        ...col,
                                        apiConfig: {
                                          ...col.apiConfig,
                                          settings: {
                                            ...col.apiConfig.settings,
                                            guidance: value,
                                          },
                                        },
                                      }
                                    : col
                                )
                              );
                            }}
                            max={20}
                            min={1}
                            step={0.5}
                            className="mt-3"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:via-indigo-700 hover:to-blue-800 text-white font-black py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 text-xl tracking-wide border-2 border-white/20"
                      onClick={() => handleApplyGeneration(column.id)}
                      disabled={isGenerating[column.id]}
                    >
                      {isGenerating[column.id] ? (
                        <div className="flex items-center gap-3">
                          <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                          <span className="font-black">Генерация...</span>
                        </div>
                      ) : (
                        <span className="font-black">✨ Применить ✨</span>
                      )}
                    </Button>

                    <div className="pt-4 border-t border-gradient-to-r from-gray-200 to-purple-200">
                      <a
                        href={`/generations/${column.apiConfig.name
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="flex items-center gap-3 text-blue-700 hover:text-blue-900 hover:underline text-sm font-bold p-3 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border border-transparent hover:border-blue-200"
                      >
                        <span className="text-2xl">📁</span>
                        <span>
                          Папка предыдущих генераций ({column.apiConfig.name}) -{" "}
                          {formatDateTime()}
                        </span>
                      </a>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 shadow-2xl border-0 rounded-3xl hover:shadow-3xl transition-all duration-500 backdrop-blur-sm border border-white/20">
                  <h4 className="font-black text-gray-900 mb-6 text-xl flex items-center gap-3">
                    <span className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg"></span>
                    Аниме аватары (превью)
                  </h4>
                  <div className="grid grid-cols-2 gap-5 max-h-80 overflow-y-auto">
                    {column.apiConfig.templates.map((template, index) => (
                      <div
                        key={index}
                        className="cursor-pointer hover:scale-125 transition-all duration-500 border-3 border-gray-200 hover:border-purple-500 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl group relative"
                        onClick={() =>
                          handleTemplateSelect(column.id, `Шаблон ${index + 1}`)
                        }
                      >
                        <img
                          src={template || ""}
                          alt={`Шаблон ${index + 1}`}
                          className="w-full h-32 object-cover group-hover:brightness-125 transition-all duration-500"
                          onError={(e) => {
                            e.currentTarget.src = "";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                        <div className="absolute bottom-2 left-2 right-2 text-white font-bold text-xs bg-black/50 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-all duration-500">
                          Шаблон {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
