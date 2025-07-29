'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Edit, Trash2, Building, Settings, Database, Shield } from 'lucide-react'
import { supabase, type InsuranceCompany } from '@/lib/supabase'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

interface CompanyFormData {
  name: string
  contact_email: string
  api_endpoint: string
  is_active: boolean
}

export default function SettingsPanel() {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<InsuranceCompany | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CompanyFormData>()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('insurance_companies')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
      toast.error('보험사 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (editingCompany) {
        // 수정
        const { error } = await supabase
          .from('insurance_companies')
          .update(data)
          .eq('id', editingCompany.id)

        if (error) throw error
        toast.success('보험사 정보가 수정되었습니다.')
      } else {
        // 추가
        const { error } = await supabase
          .from('insurance_companies')
          .insert(data)

        if (error) throw error
        toast.success('새 보험사가 추가되었습니다.')
      }

      setIsDialogOpen(false)
      setEditingCompany(null)
      reset()
      fetchCompanies()
    } catch (error) {
      console.error('Error saving company:', error)
      toast.error('보험사 정보 저장에 실패했습니다.')
    }
  }

  const handleEdit = (company: InsuranceCompany) => {
    setEditingCompany(company)
    setValue('name', company.name)
    setValue('contact_email', company.contact_email)
    setValue('api_endpoint', company.api_endpoint)
    setValue('is_active', company.is_active)
    setIsDialogOpen(true)
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm('정말로 이 보험사를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('insurance_companies')
        .delete()
        .eq('id', companyId)

      if (error) throw error
      toast.success('보험사가 삭제되었습니다.')
      fetchCompanies()
    } catch (error) {
      console.error('Error deleting company:', error)
      toast.error('보험사 삭제에 실패했습니다.')
    }
  }

  const handleToggleActive = async (companyId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('insurance_companies')
        .update({ is_active: isActive })
        .eq('id', companyId)

      if (error) throw error
      toast.success(isActive ? '보험사가 활성화되었습니다.' : '보험사가 비활성화되었습니다.')
      fetchCompanies()
    } catch (error) {
      console.error('Error toggling company status:', error)
      toast.error('보험사 상태 변경에 실패했습니다.')
    }
  }

  const openAddDialog = () => {
    setEditingCompany(null)
    reset()
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="companies" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            보험사 관리
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            시스템 설정
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            보안 설정
          </TabsTrigger>
        </TabsList>

        {/* 보험사 관리 탭 */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>보험사 관리</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openAddDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      보험사 추가
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCompany ? '보험사 수정' : '새 보험사 추가'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <Label htmlFor="name">보험사명 *</Label>
                        <Input
                          id="name"
                          {...register('name', { required: '보험사명은 필수입니다.' })}
                          placeholder="삼성화재"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="contact_email">담당자 이메일 *</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          {...register('contact_email', { 
                            required: '이메일은 필수입니다.',
                            pattern: {
                              value: /^\S+@\S+$/i,
                              message: '올바른 이메일 형식이 아닙니다.'
                            }
                          })}
                          placeholder="contact@insurance.com"
                        />
                        {errors.contact_email && (
                          <p className="text-sm text-red-600 mt-1">{errors.contact_email.message}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="api_endpoint">API 엔드포인트</Label>
                        <Input
                          id="api_endpoint"
                          {...register('api_endpoint')}
                          placeholder="https://api.insurance.com/v1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          {...register('is_active')}
                          defaultChecked={editingCompany?.is_active ?? true}
                        />
                        <Label htmlFor="is_active">활성화</Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                        >
                          취소
                        </Button>
                        <Button type="submit">
                          {editingCompany ? '수정' : '추가'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>보험사명</TableHead>
                      <TableHead>담당자 이메일</TableHead>
                      <TableHead>API 엔드포인트</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          등록된 보험사가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      companies.map((company) => (
                        <TableRow key={company.id}>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell>{company.contact_email}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {company.api_endpoint || '미설정'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={company.is_active}
                                onCheckedChange={(checked) => 
                                  handleToggleActive(company.id, checked)
                                }
                              />
                              <Badge 
                                variant={company.is_active ? "default" : "secondary"}
                                className={company.is_active ? "bg-green-500" : ""}
                              >
                                {company.is_active ? '활성' : '비활성'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(company)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(company.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시스템 설정 탭 */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  데이터베이스 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">자동 백업</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">데이터 보관 기간</span>
                  <Input className="w-20 text-center" defaultValue="365" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">백업 주기</span>
                  <select className="border rounded px-2 py-1 text-sm">
                    <option>매일</option>
                    <option>매주</option>
                    <option>매월</option>
                  </select>
                </div>
                <Button className="w-full">
                  <Database className="h-4 w-4 mr-2" />
                  지금 백업
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">이메일 알림</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">전송 실패 알림</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">일간 리포트</span>
                  <Switch />
                </div>
                <div>
                  <Label htmlFor="admin_email">관리자 이메일</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    defaultValue="admin@company.com"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>시스템 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">버전</div>
                  <div className="font-semibold">v1.0.0</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">마지막 업데이트</div>
                  <div className="font-semibold">2024-12-19</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">총 저장소 사용량</div>
                  <div className="font-semibold">245 MB</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 보안 설정 탭 */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                보안 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">2단계 인증</span>
                    <p className="text-xs text-gray-500">추가 보안을 위한 2FA 활성화</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">IP 제한</span>
                    <p className="text-xs text-gray-500">허용된 IP에서만 접근 가능</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">세션 타임아웃</span>
                    <p className="text-xs text-gray-500">자동 로그아웃 시간 설정</p>
                  </div>
                  <select className="border rounded px-2 py-1 text-sm">
                    <option>30분</option>
                    <option>1시간</option>
                    <option>2시간</option>
                    <option>4시간</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">데이터 암호화</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">고객 개인정보</span>
                    <Badge className="bg-green-500">암호화됨</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">전송 데이터</span>
                    <Badge className="bg-green-500">암호화됨</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">백업 파일</span>
                    <Badge className="bg-green-500">암호화됨</Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">접근 로그</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>오늘 로그인 시도</span>
                    <span>12회</span>
                  </div>
                  <div className="flex justify-between">
                    <span>실패한 로그인</span>
                    <span>0회</span>
                  </div>
                  <div className="flex justify-between">
                    <span>마지막 접근</span>
                    <span>2분 전</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 