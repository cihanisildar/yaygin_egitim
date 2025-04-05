'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertCircle,
  Award,
  Calendar,
  CalendarClock,
  ChevronLeft,
  Clock,
  Edit,
  Globe,
  MapPin,
  Share2,
  Trash2,
  User,
  Users,
  Video
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Event = {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'online' | 'in-person' | 'hybrid';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  capacity: number;
  enrolledStudents: number;
  points: number;
  tags: string[];
  createdBy: {
    id: string;
    name: string;
  };
};

export default function EventDetails() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event details');
        }

        const data = await response.json();
        const eventData = data.event;
        
        const formattedEvent = {
          id: eventData._id || eventData.id,
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startDateTime || eventData.startDate,
          endDate: eventData.endDateTime || eventData.endDate,
          location: eventData.location,
          type: eventData.type,
          status: eventData.status,
          capacity: eventData.capacity,
          enrolledStudents: eventData.enrolledStudents || 0,
          points: eventData.points,
          tags: eventData.tags || [],
          createdBy: {
            id: eventData.createdBy._id || eventData.createdBy.id,
            name: eventData.createdBy.username || 'Unknown'
          }
        };
        
        setEvent(formattedEvent);
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Etkinlik bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Yaklaşan';
      case 'ongoing':
        return 'Devam Ediyor';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'online':
        return <Video className="h-4 w-4 text-blue-600" />;
      case 'in-person':
        return <User className="h-4 w-4 text-green-600" />;
      case 'hybrid':
        return <Globe className="h-4 w-4 text-purple-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'online':
        return 'Online';
      case 'in-person':
        return 'Yüz Yüze';
      case 'hybrid':
        return 'Karma';
      default:
        return type;
    }
  };

  const handleDeleteEvent = async () => {
    try {
      // In a real app, make API call to delete the event
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate back to events list
      router.push('/tutor/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Etkinlik silinirken bir hata oluştu.');
    }
  };

  const getDurationText = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    
    if (durationMs > 86400000) {
      return `${Math.ceil(durationMs / 86400000)} gün`;
    } else {
      return `${Math.ceil(durationMs / 3600000)} saat`;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-500">Etkinlik bilgileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-red-700 mb-2">{error || 'Etkinlik bulunamadı'}</h2>
          <p className="text-red-600 mb-6">İstediğiniz etkinlik mevcut değil veya erişim izniniz yok.</p>
          <Button asChild>
            <Link href="/tutor/events">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Etkinlik Listesine Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="sm" className="text-white hover:text-blue-600" asChild>
              <Link href="/tutor/events">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Geri
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="bg-white/20 text-white hover:bg-white/30">
                  {getTypeText(event.type)}
                </Badge>
                <Badge className={`${getStatusColor(event.status)} border-none`}>
                  {getStatusText(event.status)}
                </Badge>
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href={`/tutor/events/${event.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Düzenle
                </Link>
              </Button>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href={`/tutor/events/${event.id}/participants`}>
                  <Users className="mr-2 h-4 w-4" />
                  Katılımcılar
                </Link>
              </Button>
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" asChild>
                <Link href={`/tutor/events/${event.id}/share`}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Paylaş
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Etkinlik Detayları</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Katılım Bilgileri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Katılımcı Sayısı</p>
                        <p className="text-lg font-semibold text-blue-700">
                          {event.enrolledStudents} / {event.capacity}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                      <Award className="h-5 w-5 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Kazanılacak Puan</p>
                        <p className="text-lg font-semibold text-indigo-700">{event.points}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Event Info */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Zaman ve Konum</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Etkinlik Türü</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    {getTypeIcon(event.type)}
                    <span className="text-gray-900 ml-2 font-medium">{getTypeText(event.type)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Başlangıç</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <CalendarClock className="text-gray-600 h-4 w-4" />
                    <span className="text-gray-900 ml-2">{formatDate(event.startDate)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bitiş</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="text-gray-600 h-4 w-4" />
                    <span className="text-gray-900 ml-2">{formatDate(event.endDate)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Süre</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="text-gray-600 h-4 w-4" />
                    <span className="text-gray-900 ml-2">{getDurationText(event.startDate, event.endDate)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Konum</h3>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <MapPin className="text-gray-600 h-4 w-4" />
                    <span className="text-gray-900 ml-2">{event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Eğitmen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {event.createdBy.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{event.createdBy.name}</p>
                    <p className="text-sm text-gray-500">Eğitmen</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Etkinliği Sil
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Etkinliği Silmek İstediğinize Emin misiniz?</DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Etkinlik ve tüm katılımcı bilgileri kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent}>
              <Trash2 className="mr-2 h-4 w-4" />
              Etkinliği Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 