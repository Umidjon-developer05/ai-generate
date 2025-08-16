import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function MidjourneyGenerations() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Midjourney Generations
            </h1>
            <p className="text-gray-600 mt-2">
              История ваших генераций Midjourney
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm">
              ← Назад к генератору
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder for generated images */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Пример генерации</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-gray-500">Изображение будет здесь</span>
              </div>
              <p className="text-sm text-gray-600">Дата: 16.08.2025</p>
              <p className="text-sm text-gray-600">Стоимость: ₽4.75</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
