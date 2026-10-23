-- ==============================================================================
-- AI Health Copilot - Supabase Database Schema Migration
-- ==============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Health Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    age INT,
    gender TEXT,
    height_cm NUMERIC(5, 2),
    weight_kg NUMERIC(5, 2),
    activity_level TEXT DEFAULT 'Moderately active',
    health_goals TEXT[] DEFAULT ARRAY['Better sleep', 'Walk 10k steps'],
    medical_history TEXT,
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    current_medications TEXT[] DEFAULT ARRAY[]::TEXT[],
    dietary_preferences TEXT,
    sleep_goal_hours NUMERIC(4, 2) DEFAULT 8.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Medical Documents & Reports Table
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size_bytes BIGINT,
    storage_path TEXT,
    document_type TEXT DEFAULT 'Laboratory', -- Prescription, Laboratory, Discharge, Other
    report_date DATE DEFAULT CURRENT_DATE,
    ocr_raw_text TEXT,
    ocr_confidence NUMERIC(4, 3),
    structured_data JSONB DEFAULT '{}'::JSONB,
    status TEXT DEFAULT 'Processed', -- Processing, Processed, Failed
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Chat Messages History Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    suggestions JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Health Measurements & Telemetry Table (Sleep, Steps, Weight, Heart Rate)
CREATE TABLE IF NOT EXISTS public.health_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- 'sleep', 'steps', 'weight', 'heart_rate', 'nutrition'
    value NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Health Insights & Recommendations Table
CREATE TABLE IF NOT EXISTS public.health_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Sleep', 'Activity', 'Weight', 'Nutrition', 'General'
    title TEXT NOT NULL,
    observation TEXT NOT NULL,
    tips JSONB DEFAULT '[]'::JSONB,
    delta_percentage NUMERIC(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Indexes for Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_medical_reports_user_id ON public.medical_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_health_measurements_user_metric ON public.health_measurements(user_id, metric_type, recorded_date);
CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON public.health_insights(user_id, created_at);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- Enforce strict tenant isolation: users can only view/edit their own records.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_insights ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Medical Reports Policies
DROP POLICY IF EXISTS "Users can view own reports" ON public.medical_reports;
CREATE POLICY "Users can view own reports" ON public.medical_reports
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON public.medical_reports;
CREATE POLICY "Users can insert own reports" ON public.medical_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON public.medical_reports;
CREATE POLICY "Users can delete own reports" ON public.medical_reports
    FOR DELETE USING (auth.uid() = user_id);

-- Chat Messages Policies
DROP POLICY IF EXISTS "Users can view own chats" ON public.chat_messages;
CREATE POLICY "Users can view own chats" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chats" ON public.chat_messages;
CREATE POLICY "Users can insert own chats" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chat_messages;
CREATE POLICY "Users can delete own chats" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Health Measurements Policies
DROP POLICY IF EXISTS "Users can access own measurements" ON public.health_measurements;
CREATE POLICY "Users can access own measurements" ON public.health_measurements
    FOR ALL USING (auth.uid() = user_id);

-- Health Insights Policies
DROP POLICY IF EXISTS "Users can access own insights" ON public.health_insights;
CREATE POLICY "Users can access own insights" ON public.health_insights
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- Auto-create profile trigger on Supabase Auth signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
