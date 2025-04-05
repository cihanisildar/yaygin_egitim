'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
// Import icons
import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Filter,
  Gift,
  User,
  X,
  XCircle
} from 'lucide-react';
import { HeaderSkeleton } from '@/app/components/ui/skeleton-shimmer';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type ItemRequest = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  item: {
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    availableQuantity: number;
  };
  status: 'pending' | 'approved' | 'rejected';
  pointsSpent: number;
  note?: string;
  createdAt: string;
};

// Loading state components
function RequestFilterSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>
      <div className="flex gap-2">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={`filter-btn-${index}`} className="h-10 w-24" />
        ))}
      </div>
    </div>
  );
}

function RequestCardSkeleton() {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="flex flex-row justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingRequests() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <RequestFilterSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, index) => (
          <RequestCardSkeleton key={`request-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}

export default function TutorRequests() {
  const { isTutor } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        let url = '/api/requests';
        if (statusFilter !== 'all') {
          url += `?status=${statusFilter}`;
        }
        
        const res = await fetch(url);
        
        if (!res.ok) {
          throw new Error('İstekleri getirme başarısız');
        }
        
        const data = await res.json();
        setRequests(data.requests);
      } catch (err) {
        console.error('İstekleri getirme hatası:', err);
        setError('İstekler yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    if (isTutor) {
      fetchRequests();
    }
  }, [isTutor, statusFilter]);

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    router.push(`/tutor/requests?${params.toString()}`);
  };

  const openRejectModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectNote('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequestId(null);
    setRejectNote('');
  };

  const processRequest = async (requestId: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      setProcessingId(requestId);
      
      const res = await fetch(`/api/requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status,
          ...(note && { note }),
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'İsteği işleme hatası');
      }
      
      // Update the request in the UI
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status } : req
      ));
      
      // If status filter is active, possibly remove from list
      if (statusFilter !== 'all' && statusFilter !== status) {
        setRequests(requests.filter(req => req.id !== requestId));
      }
      
    } catch (err: any) {
      console.error('İsteği işleme hatası:', err);
      setError(err.message || 'İstek işlenemedi. Lütfen tekrar deneyin.');
    } finally {
      setProcessingId(null);
      closeModal();
    }
  };

  const getStudentName = (student: ItemRequest['student']) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Format date in a more friendly way
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return date.toLocaleDateString('tr-TR', options);
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending':
        return 'Beklemede';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingRequests />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Gift className="w-8 h-8 mr-3 text-indigo-600" />
            <span>Öğrenci Ödül İstekleri</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Öğrenci ödül taleplerini yönetin ve yanıtlayın.
          </p>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg p-3 flex flex-col sm:flex-row gap-2 items-center">
          <div className="flex items-center text-sm text-gray-500 mr-2">
            <Filter className="w-4 h-4 mr-1" /> Filtre:
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-1.5
                ${statusFilter === 'all' 
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleStatusChange('all')}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tümü
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-1.5
                ${statusFilter === 'pending' 
                  ? 'bg-amber-500 text-white shadow-md ring-2 ring-amber-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleStatusChange('pending')}
            >
              <Clock className="w-3.5 h-3.5" /> Beklemede
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-1.5
                ${statusFilter === 'approved' 
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleStatusChange('approved')}
            >
              <CheckCircle className="w-3.5 h-3.5" /> Onaylanan
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-in-out flex items-center gap-1.5
                ${statusFilter === 'rejected' 
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleStatusChange('rejected')}
            >
              <XCircle className="w-3.5 h-3.5" /> Reddedilen
            </button>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 rounded-md p-4 mb-6 flex items-start">
          <AlertTriangle className="w-5 h-5 text-rose-500 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-rose-800">Bir hata oluştu</h3>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
        </div>
      )}
      
      {requests.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-12 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 rounded-full p-6 mb-4">
              <Filter className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">İstek bulunamadı</h3>
            <p className="text-gray-500 max-w-md">
              Seçilen filtreye uygun istek bulunmamaktadır. Filtreyi değiştirmeyi deneyin veya daha sonra tekrar kontrol edin.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5" /> Öğrenci
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Gift className="w-3.5 h-3.5 mr-1.5" /> Ödül
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Award className="w-3.5 h-3.5 mr-1.5" /> Puanlar
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" /> Tarih
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm uppercase">
                          {getStudentName(request.student).charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {getStudentName(request.student)}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{request.student.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 mb-1">
                        {request.item.name}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2 max-w-xs">
                        {request.item.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
                        <Award className="w-3.5 h-3.5 mr-1" />
                        {request.pointsSpent} puan
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full items-center w-fit
                          ${request.status === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 
                              'bg-rose-100 text-rose-800'}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1.5">{getStatusText(request.status)}</span>
                        </span>
                        {request.note && (
                          <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="font-medium">Not:</span> {request.note}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {formatDate(request.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {request.status === 'pending' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => processRequest(request.id, 'approved')}
                            disabled={processingId === request.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm 
                            text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-150
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                            {processingId === request.id ? 'İşleniyor...' : 'Onayla'}
                          </button>
                          <button
                            onClick={() => openRejectModal(request.id)}
                            disabled={processingId === request.id}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm 
                            text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-150
                            disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Reddet
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">
                          <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                          İşlendi
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Reject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div 
            className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center">
                <div className="bg-rose-100 p-2 rounded-full mr-3">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">İsteği Reddet</h3>
              </div>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-5">
              Lütfen bu isteği reddetme nedeninizi belirtin. Bu, öğrencinin isteğinin neden onaylanmadığını anlamasına yardımcı olacaktır.
            </p>
            
            <div className="mb-5">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Red Nedeni
              </label>
              <textarea
                id="note"
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-lg px-3 py-2 placeholder-gray-400 transition-all duration-150"
                placeholder="Öğrenci için açık bir neden girin"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
                onClick={closeModal}
              >
                İptal
              </button>
              <button
                type="button"
                className="inline-flex items-center px-3.5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-150
                disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => selectedRequestId && processRequest(selectedRequestId, 'rejected', rejectNote)}
                disabled={processingId === selectedRequestId}
              >
                {processingId === selectedRequestId ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Reddetmeyi Onayla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add global animation styles to your root CSS or app layout
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }

// @keyframes scaleIn {
//   from { transform: scale(0.95); opacity: 0; }
//   to { transform: scale(1); opacity: 1; }
// }

// .animate-fadeIn {
//   animation: fadeIn 0.3s ease-out;
// }

// .animate-scaleIn {
//   animation: scaleIn 0.2s ease-out;
// }