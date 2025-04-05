'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Save,
  ChevronLeft,
  X,
  CalendarClock,
  Info,
  HelpCircle,
  Video,
  User,
  Globe
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const eventFormSchema = z.object({
  title: z.string().min(5, { message: 'Etkinlik başlığı en az 5 karakter olmalıdır.' }),
  description: z.string().min(20, { message: 'Etkinlik açıklaması en az 20 karakter olmalıdır.' }),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
  location: z.string().min(3, { message: 'Konum alanı doldurulmalıdır.' }),
  type: z.enum(['online', 'in-person', 'hybrid']),
  status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']),
  capacity: z.coerce.number().min(1, { message: 'Kapasite en az 1 olmalıdır.' }),
  points: z.coerce.number().min(0, { message: 'Puan değeri negatif olamaz.' }),
  tags: z.string(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// Mock event type
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

// Mock event data (same as in the event detail page)
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Matematik Olimpiyatları Hazırlık Semineri',
    description: 'Bu seminer, matematik olimpiyatlarına hazırlanan öğrenciler için problem çözme teknikleri ve stratejileri sunacaktır.\n\nTüm katılımcılar, seminer öncesinde temel matematik kavramlarını gözden geçirmelidir. Etkinlik sırasında, olimpiyat tarzı problemleri çözmek için gerekli analitik düşünme becerileri üzerinde durulacaktır.\n\nKapsam:\n- Olimpiyat matematiği nedir?\n- Problem çözme yaklaşımları\n- Temel stratejiler ve teknikler\n- Örnek problemler ve çözümleri\n- Grup çalışması ve tartışma\n\nMatematik olimpiyatlarına katılmak isteyen veya matematiksel problem çözme becerilerini geliştirmek isteyen tüm öğrenciler bu etkinliğe katılabilir.',
    startDate: '2023-06-01T09:00:00Z',
    endDate: '2023-06-01T12:00:00Z',
    location: 'Zoom (Online)',
    type: 'online',
    status: 'upcoming',
    capacity: 30,
    enrolledStudents: 18,
    points: 50,
    tags: ['Matematik', 'Olimpiyat', 'Problem Çözme'],
    createdBy: {
      id: '101',
      name: 'Ahmet Yılmaz'
    }
  },
  {
    id: '2',
    title: 'Fizik Deneyleri Atölyesi',
    description: 'Öğrencilerin fizik kanunlarını pratik olarak gözlemleyebilecekleri interaktif bir atölye çalışması.',
    startDate: '2023-05-15T13:00:00Z',
    endDate: '2023-05-15T15:30:00Z',
    location: 'Fizik Laboratuvarı',
    type: 'in-person',
    status: 'ongoing',
    capacity: 20,
    enrolledStudents: 20,
    points: 30,
    tags: ['Fizik', 'Laboratuvar', 'Deney'],
    createdBy: {
      id: '102',
      name: 'Zeynep Kaya'
    }
  },
  {
    id: '3',
    title: 'İngilizce Konuşma Kulübü',
    description: 'Öğrencilerin İngilizce konuşma becerilerini geliştirmeleri için haftalık düzenlenen sohbet kulübü.',
    startDate: '2023-05-10T16:00:00Z',
    endDate: '2023-05-10T17:30:00Z',
    location: 'Dil Laboratuvarı',
    type: 'in-person',
    status: 'completed',
    capacity: 15,
    enrolledStudents: 12,
    points: 20,
    tags: ['İngilizce', 'Konuşma', 'Dil Becerisi'],
    createdBy: {
      id: '103',
      name: 'Elif Demir'
    }
  }
];

export default function EditEvent() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      location: '',
      type: 'online',
      status: 'upcoming',
      capacity: 1,
      points: 0,
      tags: '',
    },
  });

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        
        // In a real app, fetch from API with the event ID
        // For now, find the event in our mock data
        const mockEvent = mockEvents.find(e => e.id === eventId);
        
        if (mockEvent) {
          // Parse dates for form
          const startDate = new Date(mockEvent.startDate);
          const endDate = new Date(mockEvent.endDate);
          
          // Format dates and times for form inputs
          const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0]; // YYYY-MM-DD
          };
          
          const formatTime = (date: Date) => {
            return date.toISOString().split('T')[1].substring(0, 5); // HH:MM
          };
          
          // Set form values
          form.reset({
            title: mockEvent.title,
            description: mockEvent.description,
            startDate: formatDate(startDate),
            startTime: formatTime(startDate),
            endDate: formatDate(endDate),
            endTime: formatTime(endDate),
            location: mockEvent.location,
            type: mockEvent.type,
            status: mockEvent.status,
            capacity: mockEvent.capacity,
            points: mockEvent.points,
            tags: mockEvent.tags.join(', '),
          });
        } else {
          setError('Etkinlik bulunamadı.');
        }
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
  }, [eventId, form]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Combine date and time fields
      const startDateTime = new Date(`${data.startDate}T${data.startTime}:00Z`);
      const endDateTime = new Date(`${data.endDate}T${data.endTime}:00Z`);
      
      // Validate end date is after start date
      if (endDateTime <= startDateTime) {
        form.setError("endDate", { 
          type: "manual", 
          message: "Bitiş tarihi başlangıç tarihinden sonra olmalıdır." 
        });
        return;
      }
      
      // Create tags array from comma-separated string
      const tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
      // Prepare updated event data
      const updatedEvent = {
        ...data,
        id: eventId,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        tags,
      };
      
      // In a real app, send to API
      console.log('Updating event with data:', updatedEvent);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Etkinlik güncellendi",
        description: "Etkinlik bilgileri başarıyla güncellendi.",
      });
      
      // Navigate back to event detail page
      router.push(`/tutor/events/${eventId}`);
      
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Hata",
        description: "Etkinlik güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">{error}</h2>
          <p className="text-red-600 mb-4">İstediğiniz etkinlik mevcut değil veya erişim izniniz yok.</p>
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" asChild>
          <Link href={`/tutor/events/${eventId}`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Geri
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Etkinlik Düzenle
          </span>
        </h1>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Temel Bilgiler</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etkinlik Başlığı</FormLabel>
                    <FormControl>
                      <Input placeholder="Etkinlik başlığını girin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etkinlik Açıklaması</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Etkinlik detaylarını ve açıklamasını girin" 
                        className="min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Etkinliğin amacı, içeriği ve katılımcıların beklentileri hakkında bilgi verin.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Tarihi</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <Input 
                              type="date" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Başlangıç Saati</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Clock className="h-4 w-4" />
                            </span>
                            <Input 
                              type="time" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Tarihi</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <Input 
                              type="date" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bitiş Saati</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Clock className="h-4 w-4" />
                            </span>
                            <Input 
                              type="time" 
                              className="rounded-l-none"
                              {...field} 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konum</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <Input 
                          placeholder="Etkinlik konumunu girin" 
                          className="rounded-l-none"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Online etkinlikler için platform adı veya bağlantısı, yüz yüze etkinlikler için adres bilgisini girin.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Detaylar ve Ayarlar</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Etkinlik Türü</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online" className="flex items-center">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 mr-2">
                                <Video className="h-3 w-3" />
                              </span>
                              Online
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="in-person" id="in-person" />
                            <Label htmlFor="in-person" className="flex items-center">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 mr-2">
                                <User className="h-3 w-3" />
                              </span>
                              Yüz Yüze
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hybrid" id="hybrid" />
                            <Label htmlFor="hybrid" className="flex items-center">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 mr-2">
                                <Globe className="h-3 w-3" />
                              </span>
                              Karma
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etkinlik Durumu</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Etkinlik durumunu seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upcoming">Yaklaşan</SelectItem>
                          <SelectItem value="ongoing">Devam Ediyor</SelectItem>
                          <SelectItem value="completed">Tamamlandı</SelectItem>
                          <SelectItem value="cancelled">İptal Edildi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapasite</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Maksimum katılımcı sayısı" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puan Değeri</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="Katılımcıların kazanacağı puan" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiketler</FormLabel>
                    <FormControl>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                          <Tag className="h-4 w-4" />
                        </span>
                        <Input 
                          placeholder="Etiketleri virgülle ayırın" 
                          className="rounded-l-none"
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Örnek: Matematik, Olimpiyat, Problem Çözme
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between border-t pt-6">
              <Button variant="outline" type="button" asChild>
                <Link href={`/tutor/events/${eventId}`}>
                  <X className="mr-2 h-4 w-4" />
                  İptal
                </Link>
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Kaydet
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
} 