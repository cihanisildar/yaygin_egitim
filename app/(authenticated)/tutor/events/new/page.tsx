'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Award,
  Calendar,
  ChevronLeft,
  Clock,
  Globe,
  Info,
  MapPin,
  Plus,
  Save,
  Tag,
  User,
  Users,
  Video,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    type: 'in-person',
    capacity: 20,
    points: 0,
    tags: [] as string[]
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Log the form data before processing
      console.log('Form data before processing:', formData);
      
      // If no dates are provided, use current date/time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

      // Create consolidated datetime strings in TR timezone
      const startDateTime = formData.startDate && formData.startTime ? 
        new Date(`${formData.startDate}T${formData.startTime}`).toISOString() : 
        new Date(`${currentDate}T${currentTime}`).toISOString();
      
      const endDateTime = formData.endDate && formData.endTime ? 
        new Date(`${formData.endDate}T${formData.endTime}`).toISOString() : 
        // If no end date/time, set it to 1 hour after start
        new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();
      
      // Log the processed datetime values
      console.log('Processed datetime values:', { startDateTime, endDateTime });
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDateTime,
        endDateTime,
        location: formData.location || 'Online',
        type: formData.type,
        capacity: formData.capacity,
        points: formData.points,
        tags: formData.tags
      };

      // Log the final event data being sent
      console.log('Event data being sent to API:', eventData);

      const response = await fetch('/api/tutor/events', {  // Updated API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      // Log the response status and headers
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Try to get error details from response
        const errorData = await response.json().catch(() => null);
        console.error('API Error details:', errorData);
        throw new Error(errorData?.error || 'Failed to create event');
      }

      const responseData = await response.json();
      console.log('API Response data:', responseData);

      router.push('/tutor/events');
    } catch (error: unknown) {
      console.error('Detailed error creating event:', error);
      // Log the full error object
      if (error instanceof Error) {
        console.error('Full error object:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        alert('Etkinlik oluşturulurken bir hata oluştu: ' + error.message);
      } else {
        console.error('Unknown error:', error);
        alert('Etkinlik oluşturulurken beklenmeyen bir hata oluştu.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" asChild>
          <Link href="/tutor/events">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Geri
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Yeni Etkinlik Oluştur
          </span>
        </h1>
      </div>
      
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Etkinlik Detayları</CardTitle>
          <p className="text-sm text-gray-500">Etkinlik bilgilerini doldurun. Yıldızlı (*) alanlar zorunludur.</p>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Etkinlik Başlığı *
                </label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Etkinlik başlığını girin"
                  required
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Etkinlik Açıklaması *
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Etkinliğinizi detaylı şekilde açıklayın"
                  required
                  className="resize-y min-h-[120px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Başlangıç Saati
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Tarihi
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                    Bitiş Saati
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={handleInputChange}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  Konum *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Etkinliğin yapılacağı yer veya online platform"
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Etkinlik Türü *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Etkinlik türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in-person">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Yüz yüze</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="online">
                        <div className="flex items-center">
                          <Video className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Online</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="hybrid">
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-500" />
                          <span>Karma</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Kontenjan *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-1">
                    Kazanılacak Puan *
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      min="0"
                      value={formData.points}
                      onChange={handleInputChange}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Etiketler
                </label>
                <div className="flex items-center mb-2">
                  <div className="relative flex-1 mr-2">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="newTag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Etiket ekle"
                      className="pl-10"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                  </div>
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.length > 0 ? (
                    formData.tags.map((tag, index) => (
                      <Badge key={index} className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">Henüz etiket eklenmedi</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Bilgi</p>
                  <p>Oluşturduğunuz etkinliği yayınladıktan sonra, öğrenciler etkinliğe kayıt olabilecek ve istedikleri zaman vazgeçebileceklerdir. Kontenjan dolduğunda kayıtlar otomatik olarak kapanacaktır.</p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex justify-between py-4">
            <Button variant="outline" type="button" asChild>
              <Link href="/tutor/events">İptal</Link>
            </Button>
            <Button 
              type="submit" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Etkinliği Oluştur
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 