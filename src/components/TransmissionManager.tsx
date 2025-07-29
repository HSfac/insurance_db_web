'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { supabase, type Customer, type InsuranceCompany, type Transmission } from '@/lib/supabase'
import { toast } from 'sonner'

interface CustomerWithInsurance extends Customer {
  insurance_info: Array<Record<string, unknown>>
}

interface TransmissionWithRelations extends Transmission {
  customers?: { name: string }
  insurance_companies?: { name: string }
}

export default function TransmissionManager() {
  const [customers, setCustomers] = useState<CustomerWithInsurance[]>([])
  const [companies, setCompanies] = useState<InsuranceCompany[]>([])
  const [transmissions, setTransmissions] = useState<TransmissionWithRelations[]>([])
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 고객 데이터 불러오기
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          *,
          insurance_info (*)
        `)
        .order('created_at', { ascending: false })

      if (customersError) throw customersError

      // 보험사 데이터 불러오기
      const { data: companiesData, error: companiesError } = await supabase
        .from('insurance_companies')
        .select('*')
        .eq('is_active', true)

      if (companiesError) throw companiesError

      // 전송 이력 불러오기
      const { data: transmissionsData, error: transmissionsError } = await supabase
        .from('transmissions')
        .select(`
          *,
          customers (name),
          insurance_companies (name)
        `)
        .order('transmitted_at', { ascending: false })
        .limit(50)

      if (transmissionsError) throw transmissionsError

      setCustomers(customersData as CustomerWithInsurance[] || [])
      setCompanies(companiesData || [])
      setTransmissions(transmissionsData as TransmissionWithRelations[] || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomerSelect = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId])
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map(c => c.id))
    } else {
      setSelectedCustomers([])
    }
  }

  const handleTransmit = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('전송할 고객을 선택해주세요.')
      return
    }

    if (!selectedCompany) {
      toast.error('보험사를 선택해주세요.')
      return
    }

    setIsSending(true)
    
    try {
      const transmissionPromises = selectedCustomers.map(async (customerId) => {
        const customer = customers.find(c => c.id === customerId)
        if (!customer) return

        const transmissionData = {
          customer_id: customerId,
          company_id: selectedCompany,
          status: 'pending' as const,
          transmitted_data: {
            personal_info: {
              name: customer.name,
              birth_date: customer.birth_date,
              gender: customer.gender,
              phone: customer.phone,
              email: customer.email,
              address: customer.address,
              occupation: customer.occupation,
              income: customer.income
            },
            insurance_info: customer.insurance_info[0] || null
          },
          transmitted_by: 'temp-user-id', // 실제로는 현재 사용자 ID
          transmitted_at: new Date().toISOString()
        }

        // 실제 API 전송 로직은 여기에 구현
        // 현재는 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 전송 이력 저장
        const { error } = await supabase
          .from('transmissions')
          .insert({
            ...transmissionData,
            status: Math.random() > 0.1 ? 'completed' : 'failed', // 90% 성공률 시뮬레이션
            response_data: {
              success: Math.random() > 0.1,
              message: Math.random() > 0.1 ? '전송 완료' : '전송 실패',
              timestamp: new Date().toISOString()
            }
          })

        if (error) throw error
      })

      await Promise.all(transmissionPromises)
      
      toast.success(`${selectedCustomers.length}명의 고객 정보가 전송되었습니다.`)
      setSelectedCustomers([])
      fetchData() // 전송 이력 새로고침
    } catch (error) {
      console.error('Error transmitting data:', error)
      toast.error('데이터 전송에 실패했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />대기중</Badge>
      case 'processing':
        return <Badge variant="default"><RefreshCw className="w-3 h-3 mr-1" />처리중</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />완료</Badge>
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />실패</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 전송 설정 카드 */}
      <Card>
        <CardHeader>
          <CardTitle>새 전송 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">보험사 선택</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="보험사를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleTransmit} 
                disabled={isSending || selectedCustomers.length === 0 || !selectedCompany}
                className="w-full sm:w-auto"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? '전송 중...' : `선택된 ${selectedCustomers.length}명 전송`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 고객 선택 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>고객 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>희망보험</TableHead>
                  <TableHead>등록일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      등록된 고객이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={(checked) => handleCustomerSelect(customer.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{customer.phone}</div>
                          <div className="text-xs text-gray-500">{customer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.insurance_info[0] ? (
                          <Badge variant="outline">
                            {(customer.insurance_info[0].desired_insurance as { type?: string })?.type || '미지정'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">미지정</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 전송 이력 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>전송 이력</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>고객명</TableHead>
                  <TableHead>보험사</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>전송일시</TableHead>
                  <TableHead>응답</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      전송 이력이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  transmissions.map((transmission) => (
                    <TableRow key={transmission.id}>
                      <TableCell className="font-medium">
                        {transmission.customers?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell>
                        {transmission.insurance_companies?.name || '알 수 없음'}
                      </TableCell>
                      <TableCell>{getStatusBadge(transmission.status)}</TableCell>
                      <TableCell>{formatDate(transmission.transmitted_at)}</TableCell>
                      <TableCell>
                        {transmission.response_data && (
                          <div className="text-xs">
                            {(transmission.response_data as { message?: string }).message || '응답 없음'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 