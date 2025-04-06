"use client";

import { EventListSkeleton } from "@/app/components/ui/EventListSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  Clock,
  MoreVertical,
  Plus,
  Search,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string; // This will be populated from startDateTime
  endDate: string; // This will be populated from endDateTime
  location: string;
  type: "online" | "in-person" | "hybrid";
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  capacity: number;
  enrolledStudents: number;
  points: number;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
  };
  createdAt?: string;
};

// Define the API response type
type EventApiResponse = {
  events: {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    startDateTime?: string;
    startDate?: string;
    endDateTime?: string;
    endDate?: string;
    location: string;
    type: "online" | "in-person" | "hybrid";
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
    capacity: number;
    enrolledStudents: number;
    points: number;
    tags?: string[];
    createdBy: {
      _id?: string;
      id?: string;
      username?: string;
    };
  }[];
};

function EventCardSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardFooter>
    </Card>
  );
}

function LoadingEvents() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <EventCardSkeleton key={`loading-event-skeleton-${index}`} />
      ))}
    </div>
  );
}

// Dynamic Events List Component
function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tutor/events", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      
      // Check if data.events exists
      if (!data || !data.events) {
        throw new Error("Invalid response format");
      }

      const formattedEvents = data.events.map((event: any) => ({
        id: event._id || event.id || "",
        title: event.title || "",
        description: event.description || "",
        startDate: event.startDateTime || event.startDate || "",
        endDate: event.endDateTime || event.endDate || "",
        location: event.location || "",
        type: event.type || "online",
        status: event.status || "upcoming",
        capacity: event.capacity || 0,
        enrolledStudents: event.enrolledStudents || 0,
        points: event.points || 0,
        tags: event.tags || [],
        createdBy: {
          id: event.createdBy?._id || event.createdBy?.id || "",
          name: event.createdBy?.username || "You",
        },
      }));

      setEvents(formattedEvents);
      setFilteredEvents(formattedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query and active filter
    let filtered = events;

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (activeFilter !== "all") {
      filtered = filtered.filter((event) => event.status === activeFilter);
    }

    setFilteredEvents(filtered);
  }, [searchQuery, activeFilter, events]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Yaklaşan";
      case "ongoing":
        return "Devam Ediyor";
      case "completed":
        return "Tamamlandı";
      case "cancelled":
        return "İptal Edildi";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return <EventListSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Etkinliklerim
              </h1>
              <p className="text-blue-100">
                Öğrencileriniz için düzenlediğiniz tüm etkinlikleri yönetin
              </p>
            </div>
            <Button className="bg-white text-blue-600 hover:bg-blue-50" asChild>
              <Link href="/tutor/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Etkinlik
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Search and Filter Card */}
        <Card className="border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Etkinlik ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs
                defaultValue={activeFilter}
                className="w-full sm:w-[300px]"
                onValueChange={setActiveFilter}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="all" className="flex-1">
                    Tümü
                  </TabsTrigger>
                  <TabsTrigger value="upcoming" className="flex-1">
                    Yaklaşan
                  </TabsTrigger>
                  <TabsTrigger value="past" className="flex-1">
                    Geçmiş
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading ? (
          <LoadingEvents />
        ) : error ? (
          <Card className="border-0 shadow-lg text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  Etkinlikler Yüklenemedi
                </h3>
                <p className="text-gray-500 mb-4">{error}</p>
                <Button onClick={fetchEvents}>Tekrar Dene</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Badge variant="outline" className="ml-2">
              {filteredEvents.length} etkinlik
            </Badge>

            <Tabs
              defaultValue="grid"
              className="w-full"
              value={viewMode}
              onValueChange={(value) => setViewMode(value as "grid" | "list")}
            >
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-gray-100">
                  <TabsTrigger
                    value="grid"
                    className="data-[state=active]:bg-white"
                  >
                    Kart Görünümü
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="data-[state=active]:bg-white"
                  >
                    Liste Görünümü
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="grid" className="mt-0">
                {filteredEvents.length === 0 ? (
                  <Card className="border-0 shadow-lg text-center py-12">
                    <CardContent>
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Etkinlik Bulunamadı
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Arama kriterlerinize uygun etkinlik bulunamadı. Farklı
                        bir arama yapmayı deneyebilirsiniz.
                      </p>
                      <Button asChild>
                        <Link href="/tutor/events/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Yeni Etkinlik Oluştur
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event) => (
                      <Card
                        key={event.id}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <CardHeader className="relative pb-3">
                          <div className="flex justify-between items-start">
                            <Badge className={getStatusColor(event.status)}>
                              {getStatusText(event.status)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tutor/events/${event.id}`}>
                                    Detaylar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/tutor/events/${event.id}/edit`}>
                                    Düzenle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/tutor/events/${event.id}/participants`}
                                  >
                                    Katılımcılar
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h3 className="text-xl font-semibold mt-2 mb-1">
                            <Link
                              href={`/tutor/events/${event.id}`}
                              className="text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {event.title}
                            </Link>
                          </h3>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {event.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                            {event.description}
                          </p>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                              {formatDate(event.startDate)}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-blue-600" />
                              {new Date(event.endDate).getTime() -
                                new Date(event.startDate).getTime() >
                              86400000
                                ? `${Math.ceil(
                                    (new Date(event.endDate).getTime() -
                                      new Date(event.startDate).getTime()) /
                                      86400000
                                  )} gün`
                                : `${Math.ceil(
                                    (new Date(event.endDate).getTime() -
                                      new Date(event.startDate).getTime()) /
                                      3600000
                                  )} saat`}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Users className="h-4 w-4 mr-2 text-blue-600" />
                              {event.enrolledStudents} / {event.capacity}{" "}
                              Katılımcı
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-3 border-t">
                          <div className="flex items-center justify-between w-full">
                            <Badge
                              variant="outline"
                              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            >
                              {event.points} Puan
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                              asChild
                            >
                              <Link href={`/tutor/events/${event.id}`}>
                                Detaylar
                              </Link>
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                {filteredEvents.length === 0 ? (
                  <Card className="border-0 shadow-lg text-center py-12">
                    <CardContent>
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        Etkinlik Bulunamadı
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Arama kriterlerinize uygun etkinlik bulunamadı. Farklı
                        bir arama yapmayı deneyebilirsiniz.
                      </p>
                      <Button asChild>
                        <Link href="/tutor/events/new">
                          <Plus className="h-4 w-4 mr-2" />
                          Yeni Etkinlik Oluştur
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg font-medium text-gray-600">
                      <div className="col-span-4">Etkinlik</div>
                      <div className="col-span-2">Tarih</div>
                      <div className="col-span-1">Süre</div>
                      <div className="col-span-1">Katılım</div>
                      <div className="col-span-1">Puan</div>
                      <div className="col-span-1">Durum</div>
                      <div className="col-span-2 text-right">İşlemler</div>
                    </div>

                    {filteredEvents.map((event, index) => (
                      <div key={event.id}>
                        <div className="grid grid-cols-12 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                          <div className="col-span-4">
                            <div className="flex items-start">
                              <div className="p-2 rounded bg-blue-50 mr-3">
                                <Calendar className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">
                                  {event.title}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-1">
                                  {event.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {event.tags.slice(0, 2).map((tag) => (
                                    <Badge
                                      key={`${event.id}-${tag}`}
                                      variant="secondary"
                                      className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-2 text-sm text-gray-600">
                            {formatDate(event.startDate)}
                          </div>

                          <div className="col-span-1 text-sm text-gray-600">
                            {new Date(event.endDate).getTime() -
                              new Date(event.startDate).getTime() >
                            86400000
                              ? `${Math.ceil(
                                  (new Date(event.endDate).getTime() -
                                    new Date(event.startDate).getTime()) /
                                    86400000
                                )} gün`
                              : `${Math.ceil(
                                  (new Date(event.endDate).getTime() -
                                    new Date(event.startDate).getTime()) /
                                    3600000
                                )} saat`}
                          </div>

                          <div className="col-span-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <span>
                                {event.enrolledStudents}/{event.capacity}
                              </span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full ml-2">
                                <div
                                  className="h-2 bg-blue-500 rounded-full"
                                  style={{
                                    width: `${
                                      (event.enrolledStudents /
                                        event.capacity) *
                                      100
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="col-span-1 text-sm text-gray-600">
                            {event.points} P
                          </div>

                          <div className="col-span-1">
                            <Badge
                              className={`${getStatusColor(event.status)}`}
                            >
                              {getStatusText(event.status)}
                            </Badge>
                          </div>

                          <div className="col-span-2 flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/tutor/events/${event.id}`}>
                                Görüntüle
                              </Link>
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem key={`list-edit-${event.id}`}>
                                  <Link
                                    href={`/tutor/events/${event.id}/edit`}
                                    className="flex w-full"
                                  >
                                    Düzenle
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  key={`list-participants-${event.id}`}
                                >
                                  <Link
                                    href={`/tutor/events/${event.id}/participants`}
                                    className="flex w-full"
                                  >
                                    Katılımcılar
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  key={`list-share-${event.id}`}
                                >
                                  <Link
                                    href={`/tutor/events/${event.id}/share`}
                                    className="flex w-full"
                                  >
                                    Paylaş
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {index < filteredEvents.length - 1 && (
                          <Separator key={`separator-${event.id}`} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TutorEventsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {loading ? (
        <div className="space-y-8">
          {/* Hero Section Skeleton */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <Skeleton className="h-10 w-48 bg-white/20" />
                  <Skeleton className="h-5 w-96 mt-2 bg-white/20" />
                </div>
                <Skeleton className="h-10 w-32 bg-white/20" />
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="max-w-7xl mx-auto px-4 -mt-8">
            {/* Search and Filter Card Skeleton */}
            <Card className="border-0 shadow-lg mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-[300px]" />
                </div>
              </CardContent>
            </Card>

            {/* Events Grid Skeleton */}
            <div className="space-y-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-10 w-48" />
              </div>
              <EventListSkeleton />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <EventsList />
        </div>
      )}
    </div>
  );
}
