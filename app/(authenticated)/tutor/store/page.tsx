"use client";

import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  Coins,
  Filter,
  Package,
  Search,
  ShoppingBag,
  Tag,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type StoreItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  availableQuantity: number;
  imageUrl?: string;
};

// Mock data to use as fallback when server fails

// Loading state components
function StoreItemSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="space-y-2">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-6 w-3/4" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-10" />
      </CardFooter>
    </Card>
  );
}

export default function TutorStore() {
  const { isTutor, user } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const [filteredItems, setFilteredItems] = useState<StoreItem[]>([]);

  const fetchStoreItems = useCallback(async () => {
    console.log("Eğitmen olarak mağaza ürünleri getiriliyor:", {
      isTutor,
      userId: user?.id,
      username: user?.username,
      role: user?.role,
    });

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/store/items", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch store items");
      }

      const data = await response.json();
      setItems(data.items || []);
      setFilteredItems(data.items || []);
    } catch (error: unknown) {
      console.error("Error fetching store items:", error);

      const err = error as Error;
      setError(
        err.message || "Mağaza ürünleri yüklenemedi. Lütfen tekrar deneyin."
      );
    } finally {
      setLoading(false);
    }
  }, [isTutor, user]);

  useEffect(() => {
    if (isTutor && user) {
      fetchStoreItems();
    }
  }, [isTutor, user, fetchStoreItems]);

  useEffect(() => {
    let filtered = [...items];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply price filter
    if (priceFilter !== "all") {
      filtered = filtered.filter((item) => {
        switch (priceFilter) {
          case "low":
            return item.pointsRequired <= 100;
          case "medium":
            return item.pointsRequired > 100 && item.pointsRequired <= 300;
          case "high":
            return item.pointsRequired > 300;
          default:
            return true;
        }
      });
    }

    setFilteredItems(filtered);
  }, [searchQuery, priceFilter, items]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto py-8">
        <HeaderSkeleton />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <StoreItemSkeleton key={i} />
          ))}
        </div>

        {/* Store Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <StoreItemSkeleton key={`item-${i}`} />
          ))}
        </div>
      </div>
    );
  }

  const stats = {
    totalItems: items.length,
    averagePoints:
      Math.round(
        items.reduce((acc, item) => acc + item.pointsRequired, 0) / items.length
      ) || 0,
    totalAvailable: items.reduce(
      (acc, item) => acc + item.availableQuantity,
      0
    ),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Mağaza Yönetimi
            </span>
          </h1>
          <p className="mt-1 text-gray-600">Ürünleri görüntüleyin ve yönetin</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Toplam Ürün
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalItems}
                  </h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Ortalama Puan
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.averagePoints}
                  </h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Coins className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Stok Miktarı
                  </p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">
                    {stats.totalAvailable}
                  </h3>
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Tag className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white"
                />
              </div>
              <div className="w-full sm:w-60">
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Puan Filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Puanlar</SelectItem>
                    <SelectItem value="low">Düşük Puan (≤ 100)</SelectItem>
                    <SelectItem value="medium">Orta Puan (101-300)</SelectItem>
                    <SelectItem value="high">Yüksek Puan ({">"}300)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <StoreItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {filteredItems.length === 0 && !error && (
          <Card className="border-0 shadow-lg text-center py-12">
            <CardContent>
              <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Ürün Bulunamadı
              </h3>
              <p className="text-gray-500">
                Arama kriterlerinize uygun ürün bulunamadı. Farklı bir arama
                yapmayı deneyebilirsiniz.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Store Item Card Component
function StoreItemCard({ item }: { item: StoreItem }) {
  // Track if image has errored
  const [imageError, setImageError] = useState(false);

  // Handle image loading error
  const handleImageError = () => {
    console.log(`Resim yüklenemedi: ${item.imageUrl}`);
    setImageError(true);
  };

  return (
    <div
      className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border group`}
    >
      {item.imageUrl && !imageError ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
          <div
            className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold shadow-md`}
          >
            {item.pointsRequired} puan
          </div>
        </div>
      ) : (
        <div
          className={`relative h-48 w-full flex items-center justify-center`}
        >
          <Package className={`h-16 w-16`} />
          <div
            className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold shadow-md`}
          >
            {item.pointsRequired} puan
          </div>
        </div>
      )}

      <div className="p-5">
        <h2 className={`text-lg font-semibold mb-2 transition-colors`}>
          {item.name}
        </h2>

        <p className="text-gray-600 mb-4 text-sm line-clamp-2">
          {item.description}
        </p>

        <div className="flex items-center">
          <div className={`text-sm font-medium rounded-full px-3 py-1`}>
            {item.availableQuantity > 5
              ? `${item.availableQuantity} adet mevcut`
              : item.availableQuantity > 0
              ? `Sadece ${item.availableQuantity} adet kaldı`
              : "Stokta yok"}
          </div>
        </div>
      </div>
    </div>
  );
}
