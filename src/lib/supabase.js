import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường từ Vercel / Vite, có sẵn fallback thông số thực tế
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aokjfdalvpcspisowdzx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFva2pmZGFsdnBjc3Bpc293ZHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzUyMDEsImV4cCI6MjEwMTk1MTIwMX0.ynTeHinF-b4DMoSMnZuSaJnudVPM5EwApIidWaanq9o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
