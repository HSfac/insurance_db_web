import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export interface Customer {
  id: string
  name: string
  birth_date: string
  gender: 'male' | 'female'
  phone: string
  email: string
  address: string
  postal_code: string
  occupation: string
  income: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface InsuranceInfo {
  id: string
  customer_id: string
  current_insurance: any
  desired_insurance: any
  coverage_amount: number
  coverage_period: number
  notes: string
  created_at: string
}

export interface InsuranceCompany {
  id: string
  name: string
  contact_email: string
  api_endpoint: string
  is_active: boolean
}

export interface Transmission {
  id: string
  customer_id: string
  company_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  transmitted_data: any
  response_data: any
  transmitted_by: string
  transmitted_at: string
} 