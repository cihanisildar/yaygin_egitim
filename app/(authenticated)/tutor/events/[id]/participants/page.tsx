'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Download,
  Filter,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  User,
  UserPlus,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

type Participant = {
  id: string;
  name: string;
  avatar?: string;
  studentId: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  joinedAt: string;
  email?: string;
  phone?: string;
  class?: string;
  firstName?: string;
  lastName?: string;
  _id?: string;
};

type Event = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledStudents: number;
};

export default function EventParticipants() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [changeStatusDialog, setChangeStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<'confirmed' | 'pending' | 'cancelled'>('confirmed');

  useEffect(() => {
    const fetchEventAndParticipants = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!eventResponse.ok) {
          throw new Error('Failed to fetch event details');
        }

        const eventData = await eventResponse.json();
        const formattedEvent = {
          id: eventData.event._id || eventData.event.id,
          title: eventData.event.title,
          startDate: eventData.event.startDateTime || eventData.event.startDate,
          endDate: eventData.event.endDateTime || eventData.event.endDate,
          capacity: eventData.event.capacity,
          enrolledStudents: eventData.event.enrolledStudents || 0
        };
        
        setEvent(formattedEvent);
        
        // Fetch event participants
        const participantsResponse = await fetch(`/api/events/${eventId}/participants`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!participantsResponse.ok) {
          throw new Error('Failed to fetch participants');
        }

        const participantsData = await participantsResponse.json();
        const formattedParticipants = participantsData.participants.map((participant: Participant) => ({
          id: participant._id || participant.id,
          name: `${participant.firstName} ${participant.lastName}`,
          studentId: participant.studentId,
          status: participant.status,
          joinedAt: participant.joinedAt,
          email: participant.email,
          phone: participant.phone,
          class: participant.class
        }));
        
        setParticipants(formattedParticipants);
        setFilteredParticipants(formattedParticipants);
        
      } catch (error) {
        console.error('Error fetching event and participants:', error);
        setError('Etkinlik ve katılımcı bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventAndParticipants();
    }
  }, [eventId]);

  useEffect(() => {
    // Filter participants based on search query and status filter
    const filtered = participants.filter(participant => {
      const matchesSearch = searchQuery === '' || 
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (participant.email && participant.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredParticipants(filtered);
  }, [searchQuery, statusFilter, participants]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Onaylandı</span>
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Beklemede</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>İptal Edildi</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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

  const handleChangeStatus = (participant: Participant) => {
    setSelectedParticipant(participant);
    setNewStatus(participant.status);
    setChangeStatusDialog(true);
  };

  const saveStatusChange = async () => {
    if (!selectedParticipant) return;
    
    try {
      // In a real app, send to API
      // Here, we'll just update the local state
      const updatedParticipants = participants.map(p => 
        p.id === selectedParticipant.id ? { ...p, status: newStatus } : p
      );
      
      setParticipants(updatedParticipants);
      
      toast({
        title: "Durum güncellendi",
        description: `${selectedParticipant.name} için katılım durumu güncellendi.`,
      });
      
      setChangeStatusDialog(false);
    } catch (error) {
      console.error('Error updating participant status:', error);
      toast({
        title: "Hata",
        description: "Katılımcı durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleExportParticipants = () => {
    // In a real app, generate CSV/Excel file and download
    toast({
      title: "Katılımcılar dışa aktarıldı",
      description: "Katılımcı listesi başarıyla dışa aktarıldı.",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">{error || 'Etkinlik bulunamadı'}</h2>
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href={`/tutor/events/${eventId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Etkinliğe Dön
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Katılımcı Yönetimi
              </span>
            </h1>
            <p className="text-gray-500">{event.title}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportParticipants}>
            <Download className="mr-2 h-4 w-4" />
            Dışa Aktar
          </Button>
          <Button asChild>
            <Link href={`/tutor/events/${eventId}/invite`}>
              <UserPlus className="mr-2 h-4 w-4" />
              Öğrenci Davet Et
            </Link>
          </Button>
        </div>
      </div>
      
      <Card className="border border-gray-200 shadow-sm mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="İsim, ID veya e-posta ile ara..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Duruma göre filtrele" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm katılımcılar</SelectItem>
                  <SelectItem value="confirmed">Onaylananlar</SelectItem>
                  <SelectItem value="pending">Bekleyenler</SelectItem>
                  <SelectItem value="cancelled">İptal Edilenler</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="ghost" size="icon" onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste Görünümü</TabsTrigger>
          <TabsTrigger value="grid">Kart Görünümü</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Katılımcı Listesi</CardTitle>
                <CardDescription>Toplam: {filteredParticipants.length} katılımcı</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {filteredParticipants.length > 0 ? (
                <div className="relative overflow-x-auto rounded-md border">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3">Öğrenci</th>
                        <th scope="col" className="px-6 py-3">Durum</th>
                        <th scope="col" className="px-6 py-3">Sınıf</th>
                        <th scope="col" className="px-6 py-3">Katılım Tarihi</th>
                        <th scope="col" className="px-6 py-3">İletişim</th>
                        <th scope="col" className="px-6 py-3">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParticipants.map((participant) => (
                        <tr key={participant.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-3">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {participant.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{participant.name}</div>
                                <div className="text-xs text-gray-500">#{participant.studentId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(participant.status)}
                          </td>
                          <td className="px-6 py-4">
                            {participant.class}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {formatDate(participant.joinedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`mailto:${participant.email}`}>
                                  <Mail className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleChangeStatus(participant)}>
                                  Durum Değiştir
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/tutor/students/${participant.id}`}>
                                    Öğrenci Profilini Gör
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`mailto:${participant.email}`}>
                                    E-posta Gönder
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border rounded-md bg-gray-50">
                  <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Katılımcı bulunamadı</h3>
                  <p className="text-gray-500 mb-4">Arama kriterlerinize uygun katılımcı bulunmamaktadır.</p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant) => (
                <Card key={participant.id} className="border border-gray-200 shadow-sm overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-4">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {participant.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{participant.name}</CardTitle>
                          <CardDescription>#{participant.studentId} • {participant.class}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(participant.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{participant.email}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Katılım: {formatDate(participant.joinedAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-gray-50 pt-3 pb-3">
                    <div className="flex justify-between w-full">
                      <Button variant="ghost" size="sm" onClick={() => handleChangeStatus(participant)}>
                        Durum Değiştir
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tutor/students/${participant.id}`}>
                              Öğrenci Profilini Gör
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`mailto:${participant.email}`}>
                              E-posta Gönder
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 border rounded-md bg-gray-50">
                <User className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Katılımcı bulunamadı</h3>
                <p className="text-gray-500 mb-4">Arama kriterlerinize uygun katılımcı bulunmamaktadır.</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Filtreleri Temizle
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={changeStatusDialog} onOpenChange={setChangeStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Katılım Durumu Değiştir</DialogTitle>
            <DialogDescription>
              {selectedParticipant?.name} için katılım durumunu değiştir.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Select value={newStatus} onValueChange={(value: 'confirmed' | 'pending' | 'cancelled') => setNewStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">Onaylandı</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="cancelled">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeStatusDialog(false)}>
              İptal
            </Button>
            <Button onClick={saveStatusChange}>
              Değişiklikleri Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 