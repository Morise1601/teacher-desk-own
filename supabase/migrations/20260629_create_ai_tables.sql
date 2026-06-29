-- Create AI history table
CREATE TABLE IF NOT EXISTS public.ai_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    input_parameters JSONB NOT NULL,
    generated_content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create AI saved content table
CREATE TABLE IF NOT EXISTS public.ai_saved_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    is_favorite BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create AI templates table
CREATE TABLE IF NOT EXISTS public.ai_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE, -- NULL means system template
    title VARCHAR(255) NOT NULL,
    description TEXT,
    feature_type VARCHAR(50) NOT NULL,
    input_parameters JSONB NOT NULL,
    is_system BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create AI usage statistics table
CREATE TABLE IF NOT EXISTS public.ai_usage_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.ai_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_statistics ENABLE ROW LEVEL SECURITY;

-- Enable RLS Policies for teachers
CREATE POLICY "Teachers can manage their own AI history" 
ON public.ai_history 
FOR ALL 
USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()));

CREATE POLICY "Teachers can manage their own saved content" 
ON public.ai_saved_content 
FOR ALL 
USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()));

CREATE POLICY "Teachers can view system templates or manage their own templates" 
ON public.ai_templates 
FOR ALL 
USING (is_system = true OR teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()));

CREATE POLICY "Teachers can view their own usage stats" 
ON public.ai_usage_statistics 
FOR ALL 
USING (teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()));

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ai_history_teacher ON public.ai_history(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_history_feature ON public.ai_history(feature_type);
CREATE INDEX IF NOT EXISTS idx_ai_saved_content_teacher ON public.ai_saved_content(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_saved_content_fav ON public.ai_saved_content(is_favorite);
CREATE INDEX IF NOT EXISTS idx_ai_templates_teacher ON public.ai_templates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_teacher ON public.ai_usage_statistics(teacher_id);

-- Insert sample system templates
INSERT INTO public.ai_templates (title, description, feature_type, input_parameters, is_system)
VALUES 
('Science Lesson: Intro to Gravity', 'A beginner-friendly lesson plan for introducing gravity concepts to grade 7/8.', 'lesson_plan', '{"subject": "Science", "topic": "Introduction to Gravity", "grade": "Grade 7", "duration": "45 mins", "objectives": "Understand gravitational force and acceleration", "method": "Lecture & Experiments", "difficulty": "Beginner", "language": "English", "instructions": "Include simple household materials"}', true),
('Mathematics Quiz: Quadratic Equations', 'An intermediate quiz containing MCQs and standard answers for quadratic equations.', 'quiz', '{"subject": "Mathematics", "topic": "Quadratic Equations", "grade": "Grade 10", "difficulty": "Intermediate", "numQuestions": 5}', true),
('English Assignment: Creative Writing', 'An assignment prompt and evaluation criteria for classroom descriptive writing.', 'assignment', '{"subject": "English", "topic": "Creative Descriptive Writing", "grade": "Grade 9", "difficulty": "Intermediate", "numQuestions": 1, "type": "Short Answer", "marks": 20, "duration": "30 mins"}', true),
('Parent-Teacher Meeting Notice', 'Professional template for announcing upcoming parent-teacher conferences.', 'announcement', '{"topic": "Parent-Teacher Meeting", "purpose": "Discuss Term 1 Progress", "tone": "Professional", "audience": "Parents"}', true);
