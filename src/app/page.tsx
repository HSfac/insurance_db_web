'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserPlus, Users, Send, BarChart3, Settings } from 'lucide-react'

// 컴포넌트들 (임시)
import CustomerForm from '@/components/CustomerForm'
import CustomerList from '@/components/CustomerList'
import TransmissionManager from '@/components/TransmissionManager'
import Dashboard from '@/components/Dashboard'
import SettingsPanel from '@/components/SettingsPanel'

export default function Home() {
  const [activeTab, setActiveTab] = useState('register')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">보험 DB 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">관리자님 환영합니다</span>
              <Button variant="outline" size="sm">
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              고객 등록
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              고객 목록
            </TabsTrigger>
            <TabsTrigger value="transmission" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              전송 관리
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              통계
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>새 고객 등록</CardTitle>
                <CardDescription>
                  고객의 개인정보와 보험 관련 정보를 입력하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>고객 목록</CardTitle>
                <CardDescription>
                  등록된 고객 정보를 조회하고 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transmission" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>보험사 전송 관리</CardTitle>
                <CardDescription>
                  고객 데이터를 보험사에 전송하고 상태를 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransmissionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>통계 대시보드</CardTitle>
                <CardDescription>
                  고객 등록 및 전송 현황을 확인하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
                <CardDescription>
                  보험사 정보 및 시스템 설정을 관리하세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
