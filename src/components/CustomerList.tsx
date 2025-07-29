'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search, Filter, MoreHorizontal, Edit, Trash2, Download } from 'lucide-react'
import { supabase, type Customer, type InsuranceInfo } from '@/lib/supabase'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

interface CustomerWithInsurance extends Customer {
  insurance_info: InsuranceInfo[]
}

export default function CustomerList() {
  const [customers, setCustomers] = useState<CustomerWithInsurance[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithInsurance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithInsurance | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 고객 데이터 불러오기
  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          insurance_info (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCustomers(data as CustomerWithInsurance[] || [])
      setFilteredCustomers(data as CustomerWithInsurance[] || [])
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('고객 목록을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  // 검색 필터링
  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.occupation.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  // 고객 삭제
  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('정말로 이 고객 정보를 삭제하시겠습니까?')) return

    try {
      // 관련된 보험 정보 먼저 삭제
      await supabase
        .from('insurance_info')
        .delete()
        .eq('customer_id', customerId)

      // 고객 정보 삭제
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error

      toast.success('고객 정보가 삭제되었습니다.')
      fetchCustomers()
    } catch (error) {
      console.error('Error deleting customer:', error)
      toast.error('고객 정보 삭제에 실패했습니다.')
    }
  }

  // 엑셀 다운로드
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      toast.error('다운로드할 데이터가 없습니다.')
      return
    }

    const exportData = filteredCustomers.map(customer => ({
      이름: customer.name,
      생년월일: customer.birth_date,
      성별: customer.gender === 'male' ? '남성' : '여성',
      전화번호: customer.phone,
      이메일: customer.email,
      주소: customer.address,
      우편번호: customer.postal_code,
      직업: customer.occupation,
      연소득: customer.income,
      등록일: new Date(customer.created_at).toLocaleDateString('ko-KR'),
      보험종류: customer.insurance_info[0]?.desired_insurance?.type || '',
      보장금액: customer.insurance_info[0]?.coverage_amount || '',
      보장기간: customer.insurance_info[0]?.coverage_period || ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '고객목록')
    
    const fileName = `고객목록_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
    
    toast.success('엑셀 파일이 다운로드되었습니다.')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getInsuranceType = (customer: CustomerWithInsurance): string => {
    if (customer.insurance_info && customer.insurance_info.length > 0) {
      const desired = customer.insurance_info[0].desired_insurance
      return (desired?.type as string) || '미지정'
    }
    return '미지정'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">고객 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 검색 및 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="이름, 이메일, 전화번호, 직업으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            필터
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </Button>
          <Badge variant="secondary">
            총 {filteredCustomers.length}명
          </Badge>
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>생년월일</TableHead>
              <TableHead>직업</TableHead>
              <TableHead>희망보험</TableHead>
              <TableHead>등록일</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '등록된 고객이 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.gender === 'male' ? '남성' : '여성'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{customer.phone}</div>
                      <div className="text-xs text-gray-500">{customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(customer.birth_date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm">{customer.occupation}</div>
                      <div className="text-xs text-gray-500">{customer.income.toLocaleString()}만원</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getInsuranceType(customer)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          자세히 보기
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 고객 상세 정보 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>고객 상세 정보</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* 개인정보 */}
              <div>
                <h3 className="font-semibold text-lg mb-3">개인정보</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">이름:</span> {selectedCustomer.name}
                  </div>
                  <div>
                    <span className="font-medium">생년월일:</span> {formatDate(selectedCustomer.birth_date)}
                  </div>
                  <div>
                    <span className="font-medium">성별:</span> {selectedCustomer.gender === 'male' ? '남성' : '여성'}
                  </div>
                  <div>
                    <span className="font-medium">전화번호:</span> {selectedCustomer.phone}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">이메일:</span> {selectedCustomer.email}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">주소:</span> ({selectedCustomer.postal_code}) {selectedCustomer.address}
                  </div>
                  <div>
                    <span className="font-medium">직업:</span> {selectedCustomer.occupation}
                  </div>
                  <div>
                    <span className="font-medium">연소득:</span> {selectedCustomer.income.toLocaleString()}만원
                  </div>
                </div>
              </div>

              {/* 보험정보 */}
              {selectedCustomer.insurance_info && selectedCustomer.insurance_info.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">보험정보</h3>
                  {selectedCustomer.insurance_info.map((insurance, index) => (
                    <div key={index} className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">희망보험:</span> {getInsuranceType(selectedCustomer)}
                        </div>
                        <div>
                          <span className="font-medium">보장금액:</span> {insurance.coverage_amount?.toLocaleString()}만원
                        </div>
                        <div>
                          <span className="font-medium">보장기간:</span> {insurance.coverage_period}년
                        </div>
                      </div>
                      {insurance.current_insurance && (
                        <div>
                          <span className="font-medium">현재가입보험:</span>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs">
                            {JSON.stringify(insurance.current_insurance, null, 2)}
                          </pre>
                        </div>
                      )}
                      {insurance.notes && (
                        <div>
                          <span className="font-medium">특이사항:</span>
                          <p className="mt-1 p-2 bg-gray-100 rounded">{insurance.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 등록정보 */}
              <div>
                <h3 className="font-semibold text-lg mb-3">등록정보</h3>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">등록일:</span> {formatDate(selectedCustomer.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">수정일:</span> {formatDate(selectedCustomer.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 