-- Migration 002: Row Level Security (RLS) Policies

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can read all user profiles (for assignee dropdowns)
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Profiles: Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Tasks: Authenticated users can view tasks (assigned to them, created by them, or all organization tasks)
DROP POLICY IF EXISTS "Users can view tasks" ON public.tasks;
CREATE POLICY "Users can view tasks"
    ON public.tasks FOR SELECT
    TO authenticated
    USING (true);

-- Tasks: Authenticated users can create tasks
DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
CREATE POLICY "Users can insert tasks"
    ON public.tasks FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Tasks: Authenticated users can update tasks they created or are assigned to
DROP POLICY IF EXISTS "Users can update tasks" ON public.tasks;
CREATE POLICY "Users can update tasks"
    ON public.tasks FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Tasks: Authenticated users can delete tasks they created
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
    ON public.tasks FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
