'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// 폼 검증 스키마
const customerSchema = z.object({
  name: z.string().min(2, '이름은 2글자 이상이어야 합니다'),
  birth_date: z.string().min(1, '생년월일을 입력해주세요'),
  gender: z.enum(['male', 'female']),
  phone: z.string().min(10, '올바른 전화번호를 입력해주세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  address: z.string().min(5, '주소를 입력해주세요'),
  postal_code: z.string().min(5, '우편번호를 입력해주세요'),
  occupation: z.string().min(1, '직업을 입력해주세요'),
  income: z.number().min(0, '소득은 0 이상이어야 합니다'),
  current_insurance: z.string().optional(),
  desired_insurance: z.string().min(1, '원하는 보험 종류를 선택해주세요'),
  coverage_amount: z.number().min(0, '보장 금액을 입력해주세요'),
  coverage_period: z.number().min(1, '보장 기간을 입력해주세요'),
  notes: z.string().optional()
})

type CustomerFormData = z.infer<typeof customerSchema>

export default function CustomerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema)
  })

  const onSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true)
    
    try {
      // 고객 기본 정보 저장
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: data.name,
          birth_date: data.birth_date,
          gender: data.gender,
          phone: data.phone,
          email: data.email,
          address: data.address,
          postal_code: data.postal_code,
          occupation: data.occupation,
          income: data.income,
          created_by: 'temp-user-id' // 실제로는 현재 사용자 ID
        })
        .select()
        .single()

      if (customerError) throw customerError

      // 보험 정보 저장
      const { error: insuranceError } = await supabase
        .from('insurance_info')
        .insert({
          customer_id: customerData.id,
          current_insurance: data.current_insurance ? JSON.parse(data.current_insurance as string) : null,
          desired_insurance: JSON.parse(data.desired_insurance as string),
          coverage_amount: data.coverage_amount,
          coverage_period: data.coverage_period,
          notes: data.notes
        })

      if (insuranceError) throw insuranceError

      toast.success('고객 정보가 성공적으로 등록되었습니다!')
      reset()
    } catch (error) {
      console.error('Error:', error)
      toast.error('고객 정보 등록에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 개인정보 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>개인정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="홍길동"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="birth_date">생년월일 *</Label>
              <Input
                id="birth_date"
                type="date"
                {...register('birth_date')}
              />
              {errors.birth_date && (
                <p className="text-sm text-red-600 mt-1">{errors.birth_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gender">성별 *</Label>
              <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female')}>
                <SelectTrigger>
                  <SelectValue placeholder="성별을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">남성</SelectItem>
                  <SelectItem value="female">여성</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-sm text-red-600 mt-1">{errors.gender.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="010-1234-5678"
              />
              {errors.phone && (
                <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="hong@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="postal_code">우편번호 *</Label>
              <Input
                id="postal_code"
                {...register('postal_code')}
                placeholder="12345"
              />
              {errors.postal_code && (
                <p className="text-sm text-red-600 mt-1">{errors.postal_code.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="address">주소 *</Label>
              <Textarea
                id="address"
                {...register('address')}
                placeholder="서울시 강남구 테헤란로 123"
                rows={3}
              />
              {errors.address && (
                <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="occupation">직업 *</Label>
              <Input
                id="occupation"
                {...register('occupation')}
                placeholder="회사원"
              />
              {errors.occupation && (
                <p className="text-sm text-red-600 mt-1">{errors.occupation.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="income">연소득 (만원) *</Label>
              <Input
                id="income"
                type="number"
                {...register('income', { valueAsNumber: true })}
                placeholder="3000"
              />
              {errors.income && (
                <p className="text-sm text-red-600 mt-1">{errors.income.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 보험정보 섹션 */}
        <Card>
          <CardHeader>
            <CardTitle>보험정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current_insurance">현재 가입 보험</Label>
              <Textarea
                id="current_insurance"
                {...register('current_insurance')}
                placeholder='{"type": "생명보험", "company": "삼성생명", "amount": 1000}'
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">JSON 형태로 입력하세요</p>
            </div>

            <div>
              <Label htmlFor="desired_insurance">원하는 보험 종류 *</Label>
              <Select onValueChange={(value) => setValue('desired_insurance', JSON.stringify({ type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="보험 종류를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="생명보험">생명보험</SelectItem>
                  <SelectItem value="건강보험">건강보험</SelectItem>
                  <SelectItem value="자동차보험">자동차보험</SelectItem>
                  <SelectItem value="화재보험">화재보험</SelectItem>
                  <SelectItem value="여행보험">여행보험</SelectItem>
                </SelectContent>
              </Select>
              {errors.desired_insurance && (
                <p className="text-sm text-red-600 mt-1">{errors.desired_insurance.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coverage_amount">보장 금액 (만원) *</Label>
              <Input
                id="coverage_amount"
                type="number"
                {...register('coverage_amount', { valueAsNumber: true })}
                placeholder="1000"
              />
              {errors.coverage_amount && (
                <p className="text-sm text-red-600 mt-1">{errors.coverage_amount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="coverage_period">보장 기간 (년) *</Label>
              <Input
                id="coverage_period"
                type="number"
                {...register('coverage_period', { valueAsNumber: true })}
                placeholder="10"
              />
              {errors.coverage_period && (
                <p className="text-sm text-red-600 mt-1">{errors.coverage_period.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">특이사항</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="추가 정보나 특이사항을 입력하세요"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => reset()}>
          초기화
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '등록 중...' : '고객 등록'}
        </Button>
      </div>
    </form>
  )
} 