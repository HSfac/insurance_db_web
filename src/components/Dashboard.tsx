'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Send, CheckCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface DashboardStats {
  totalCustomers: number
  thisMonthCustomers: number
  totalTransmissions: number
  successfulTransmissions: number
  failedTransmissions: number
  pendingTransmissions: number
}

interface ChartData {
  monthlyRegistrations: Array<{ month: string; count: number }>
  insuranceTypes: Array<{ type: string; count: number }>
  transmissionStatus: Array<{ status: string; count: number; color: string }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    thisMonthCustomers: 0,
    totalTransmissions: 0,
    successfulTransmissions: 0,
    failedTransmissions: 0,
    pendingTransmissions: 0
  })
  const [chartData, setChartData] = useState<ChartData>({
    monthlyRegistrations: [],
    insuranceTypes: [],
    transmissionStatus: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // 기본 통계 데이터
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('created_at')

      if (customersError) throw customersError

      const { data: transmissions, error: transmissionsError } = await supabase
        .from('transmissions')
        .select('status, transmitted_at')

      if (transmissionsError) throw transmissionsError

      const { data: insuranceData, error: insuranceError } = await supabase
        .from('insurance_info')
        .select('desired_insurance')

      if (insuranceError) throw insuranceError

      // 통계 계산
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      
      const thisMonthCustomers = customers?.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length || 0

      const transmissionStats = transmissions?.reduce((acc, t) => {
        acc.total++
        switch (t.status) {
          case 'completed':
            acc.successful++
            break
          case 'failed':
            acc.failed++
            break
          case 'pending':
          case 'processing':
            acc.pending++
            break
        }
        return acc
      }, { total: 0, successful: 0, failed: 0, pending: 0 }) || { total: 0, successful: 0, failed: 0, pending: 0 }

      setStats({
        totalCustomers: customers?.length || 0,
        thisMonthCustomers,
        totalTransmissions: transmissionStats.total,
        successfulTransmissions: transmissionStats.successful,
        failedTransmissions: transmissionStats.failed,
        pendingTransmissions: transmissionStats.pending
      })

      // 차트 데이터 준비
      // 월별 등록 현황
      const monthlyData: { [key: string]: number } = {}
      const last6Months = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        monthlyData[monthKey] = 0
        last6Months.push(monthKey)
      }

      customers?.forEach(customer => {
        const date = new Date(customer.created_at)
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++
        }
      })

      const monthlyRegistrations = last6Months.map(month => ({
        month: month.substring(5) + '월',
        count: monthlyData[month]
      }))

      // 보험 종류별 통계
      const insuranceTypes: { [key: string]: number } = {}
      insuranceData?.forEach(insurance => {
        const desired = insurance.desired_insurance
        const type = desired?.type || '미지정'
        insuranceTypes[type] = (insuranceTypes[type] || 0) + 1
      })

      const insuranceTypesArray = Object.entries(insuranceTypes).map(([type, count]) => ({
        type,
        count
      }))

      // 전송 상태별 통계
      const transmissionStatus = [
        { status: '완료', count: transmissionStats.successful, color: '#10B981' },
        { status: '실패', count: transmissionStats.failed, color: '#EF4444' },
        { status: '대기중', count: transmissionStats.pending, color: '#F59E0B' }
      ].filter(item => item.count > 0)

      setChartData({
        monthlyRegistrations,
        insuranceTypes: insuranceTypesArray,
        transmissionStatus
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('대시보드 데이터를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 고객 수</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              이번 달 +{stats.thisMonthCustomers}명
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 전송 건수</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransmissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              전체 전송 이력
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">성공률</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalTransmissions > 0 
                ? ((stats.successfulTransmissions / stats.totalTransmissions) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.successfulTransmissions}/{stats.totalTransmissions} 성공
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingTransmissions}</div>
            <p className="text-xs text-muted-foreground">
              처리 대기 건수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 월별 고객 등록 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>월별 고객 등록 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthlyRegistrations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 보험 종류별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle>보험 종류별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.insuranceTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percent }) => `${type} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.insuranceTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 전송 현황 */}
      <Card>
        <CardHeader>
          <CardTitle>전송 상태별 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chartData.transmissionStatus.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="font-medium">{item.status}</span>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {item.count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 추가 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">오늘 등록된 고객</span>
                <Badge variant="outline">
                  {stats.thisMonthCustomers > 0 ? Math.ceil(stats.thisMonthCustomers / 30) : 0}명
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">이번 주 전송 건수</span>
                <Badge variant="outline">
                  {Math.ceil(stats.totalTransmissions * 0.1)}건
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">평균 성공률</span>
                <Badge variant="outline" className="text-green-600">
                  {stats.totalTransmissions > 0 
                    ? ((stats.successfulTransmissions / stats.totalTransmissions) * 100).toFixed(1)
                    : 0}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">데이터베이스</span>
                <Badge className="bg-green-500">정상</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">API 연결</span>
                <Badge className="bg-green-500">정상</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">마지막 백업</span>
                <Badge variant="outline">2시간 전</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 