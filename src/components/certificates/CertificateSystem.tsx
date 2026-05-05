import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Award,
  Download,
  Share2,
  Shield,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Hash,
  Link,
  QrCode,
  Eye,
  Printer,
  Mail,
  Globe,
  Star,
  Trophy,
  Zap,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  Search,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
  certificate_id: string;
  user_id: number;
  course_id: number;
  course_title: string;
  instructor_name: string;
  student_name: string;
  completion_date: string;
  issue_date: string;
  grade: number;
  blockchain_hash: string;
  blockchain_verified: boolean;
  verification_url: string;
  certificate_url: string;
  template_id: string;
  skills_acquired: string[];
  duration_seconds: number;
  status: 'pending' | 'issued' | 'revoked';
}

interface BlockchainVerification {
  hash: string;
  block_number: number;
  transaction_id: string;
  timestamp: string;
  verified: boolean;
  network: 'ethereum' | 'polygon' | 'bsc';
  gas_used: number;
  verification_cost: number;
}

interface CertificateTemplate {
  template_id: string;
  name: string;
  description: string;
  preview_url: string;
  category: string;
  premium: boolean;
}

export const CertificateSystem: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [verificationHash, setVerificationHash] = useState('');

  // Fetch user certificates
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['user-certificates', user?.user_id],
    queryFn: async () => {
      const response = await fetch(`/api/certificates/user/${user?.user_id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    enabled: !!user
  });

  // Fetch certificate templates
  const { data: templates } = useQuery({
    queryKey: ['certificate-templates'],
    queryFn: async () => {
      const response = await fetch('/api/certificates/templates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    }
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async ({ courseId, templateId }: { courseId: number; templateId: string }) => {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          course_id: courseId,
          template_id: templateId,
          blockchain_verify: true
        })
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Sertifika başarıyla oluşturuldu!');
      setIsGenerating(false);
    },
    onError: () => {
      toast.error('Sertifika oluşturulurken hata oluştu');
      setIsGenerating(false);
    }
  });

  // Verify certificate on blockchain
  const verifyCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const response = await fetch(`/api/certificates/${certificateId}/verify-blockchain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Blockchain doğrulaması tamamlandı!');
    }
  });

  // Verify certificate by hash
  const verifyByHashMutation = useMutation({
    mutationFn: async (hash: string) => {
      const response = await fetch(`/api/certificates/verify/${hash}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast.success('Sertifika doğrulandı!');
      } else {
        toast.error('Sertifika doğrulanamadı!');
      }
    }
  });

  const generateCertificateCanvas = (certificate: Certificate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SERTİFİKA', canvas.width / 2, 150);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillText('Başarı Belgesi', canvas.width / 2, 190);

    // Student name
    ctx.font = 'bold 36px Arial';
    ctx.fillText(certificate.student_name, canvas.width / 2, 280);

    // Course title
    ctx.font = '28px Arial';
    ctx.fillText(`"${certificate.course_title}" kursunu`, canvas.width / 2, 340);
    ctx.fillText('başarıyla tamamlamıştır.', canvas.width / 2, 380);

    // Instructor
    ctx.font = '20px Arial';
    ctx.fillText(`Eğitmen: ${certificate.instructor_name}`, canvas.width / 2, 450);

    // Date
    ctx.fillText(`Tarih: ${new Date(certificate.completion_date).toLocaleDateString('tr-TR')}`, canvas.width / 2, 490);

    // Grade
    ctx.fillText(`Not: ${certificate.grade}/100`, canvas.width / 2, 530);

    // Blockchain hash
    ctx.font = '14px monospace';
    ctx.fillText(`Blockchain Hash: ${certificate.blockchain_hash}`, canvas.width / 2, 600);

    // QR Code placeholder
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(canvas.width - 150, canvas.height - 150, 100, 100);
    ctx.fillStyle = '#000000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', canvas.width - 100, canvas.height - 95);
  };

  const downloadCertificate = (certificate: Certificate) => {
    generateCertificateCanvas(certificate);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `certificate-${certificate.certificate_id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const shareCertificate = (certificate: Certificate) => {
    if (navigator.share) {
      navigator.share({
        title: 'Sertifikam',
        text: `${certificate.course_title} kursunu başarıyla tamamladım!`,
        url: certificate.verification_url
      });
    } else {
      navigator.clipboard.writeText(certificate.verification_url);
      toast.success('Doğrulama linki kopyalandı!');
    }
  };

  const CertificateCard: React.FC<{ certificate: Certificate }> = ({ certificate }) => (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{certificate.course_title}</h3>
              <p className="text-sm text-gray-600">Eğitmen: {certificate.instructor_name}</p>
            </div>
          </div>
          <Badge variant={certificate.blockchain_verified ? 'default' : 'secondary'}>
            {certificate.blockchain_verified ? (
              <>
                <Shield className="w-3 h-3 mr-1" />
                Doğrulandı
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 mr-1" />
                Beklemede
              </>
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-600">Tamamlanma:</span>
            <p className="font-medium">{new Date(certificate.completion_date).toLocaleDateString('tr-TR')}</p>
          </div>
          <div>
            <span className="text-gray-600">Not:</span>
            <p className="font-medium">{certificate.grade}/100</p>
          </div>
          <div>
            <span className="text-gray-600">Süre:</span>
            <p className="font-medium">{Math.round(certificate.duration_seconds / 3600)} saat</p>
          </div>
          <div>
            <span className="text-gray-600">Beceriler:</span>
            <p className="font-medium">{certificate.skills_acquired.length} beceri</p>
          </div>
        </div>

        {certificate.blockchain_verified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Blockchain Doğrulandı</span>
            </div>
            <p className="text-xs text-green-700 mt-1 font-mono">
              {certificate.blockchain_hash.substring(0, 20)}...
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            onClick={() => downloadCertificate(certificate)}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            İndir
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => shareCertificate(certificate)}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedCertificate(certificate)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const BlockchainVerificationPanel: React.FC = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Blockchain Doğrulama
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Sertifika Hash'i ile Doğrula
          </label>
          <div className="flex space-x-2">
            <Input
              placeholder="Blockchain hash girin..."
              value={verificationHash}
              onChange={(e) => setVerificationHash(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              onClick={() => verifyByHashMutation.mutate(verificationHash)}
              disabled={!verificationHash || verifyByHashMutation.isPending}
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Blockchain Avantajları</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Değiştirilemez kayıt</li>
            <li>• Küresel doğrulama</li>
            <li>• Sahtecilik koruması</li>
            <li>• Kalıcı geçerlilik</li>
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
            <div className="font-medium">{certificates?.length || 0}</div>
            <div className="text-gray-600">Toplam Sertifika</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Zap className="w-6 h-6 mx-auto mb-1 text-blue-600" />
            <div className="font-medium">
              {certificates?.filter((c: Certificate) => c.blockchain_verified).length || 0}
            </div>
            <div className="text-gray-600">Doğrulanmış</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Award className="w-8 h-8 mr-3 text-yellow-600" />
            Sertifika Sistemi
          </h1>
          <p className="text-gray-600 mt-1">Blockchain doğrulamalı dijital sertifikalar</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sertifika
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold">{certificates?.length || 0}</div>
                <div className="text-sm text-gray-600">Toplam Sertifika</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">
                  {certificates?.filter((c: Certificate) => c.blockchain_verified).length || 0}
                </div>
                <div className="text-sm text-gray-600">Blockchain Doğrulandı</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">
                  {certificates?.reduce((acc: number, c: Certificate) => acc + c.grade, 0) / (certificates?.length || 1) || 0}
                </div>
                <div className="text-sm text-gray-600">Ortalama Not</div>
              </CardContent>
            </Card>
          </div>

          {/* Certificates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates?.map((certificate: Certificate) => (
                <CertificateCard key={certificate.certificate_id} certificate={certificate} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <BlockchainVerificationPanel />

          {/* Certificate Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Sertifika Şablonları</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates?.slice(0, 3).map((template: CertificateTemplate) => (
                  <div
                    key={template.template_id}
                    className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedTemplate(template.template_id)}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded"></div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-600">{template.category}</div>
                    </div>
                    {template.premium && (
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden canvas for certificate generation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Certificate Detail Modal would go here */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sertifika Detayları</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCertificate(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg text-center">
                  <Award className="w-16 h-16 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">{selectedCertificate.course_title}</h2>
                  <p className="text-lg">{selectedCertificate.student_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Eğitmen</label>
                    <p className="font-medium">{selectedCertificate.instructor_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tamamlanma Tarihi</label>
                    <p className="font-medium">
                      {new Date(selectedCertificate.completion_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Not</label>
                    <p className="font-medium">{selectedCertificate.grade}/100</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Süre</label>
                    <p className="font-medium">{Math.round(selectedCertificate.duration_seconds / 3600)} saat</p>
                  </div>
                </div>

                {selectedCertificate.blockchain_verified && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Blockchain Doğrulaması
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Hash:</span>
                        <p className="font-mono text-green-700 break-all">
                          {selectedCertificate.blockchain_hash}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Doğrulama URL:</span>
                        <a
                          href={selectedCertificate.verification_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center"
                        >
                          Blockchain'de Görüntüle
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    onClick={() => downloadCertificate(selectedCertificate)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Sertifikayı İndir
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => shareCertificate(selectedCertificate)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Paylaş
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
