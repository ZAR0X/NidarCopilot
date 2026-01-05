-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.action_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  description text,
  priority text CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text])),
  is_completed boolean DEFAULT false,
  action_type text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT action_items_pkey PRIMARY KEY (id),
  CONSTRAINT action_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.compliance_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  due_date date NOT NULL,
  event_type text,
  description text,
  is_global boolean DEFAULT true,
  CONSTRAINT compliance_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  report_date date DEFAULT CURRENT_DATE,
  image_url text,
  notes text,
  total_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT daily_reports_pkey PRIMARY KEY (id),
  CONSTRAINT daily_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  amount numeric NOT NULL,
  type text CHECK (type = ANY (ARRAY['credit'::text, 'debit'::text, 'income'::text, 'expense'::text])),
  category text,
  description text,
  is_digital boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  payment_mode text DEFAULT 'Online'::text,
  date timestamp with time zone DEFAULT now(),
  customer_gstin text,
  image_url text,
  CONSTRAINT ledger_pkey PRIMARY KEY (id),
  CONSTRAINT ledger_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  meta jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  phone text UNIQUE,
  business_type text CHECK (business_type = ANY (ARRAY['trader'::text, 'freelancer'::text, 'gig_worker'::text, 'manufacturer'::text])),
  turnover_ytd numeric DEFAULT 0,
  tax_regime text DEFAULT 'unregistered'::text,
  risk_score numeric DEFAULT 0,
  annual_revenue text,
  has_gst boolean DEFAULT false,
  sub_category text,
  full_name text,
  age integer,
  gender text,
  avatar_url text,
  cover_image_url text,
  revenue_goal numeric,
  bio text,
  location text,
  business_name text,
  approx_income text,
  past_earnings text,
  gst_number text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.rules (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  content text,
  source_document text,
  applicable_to ARRAY,
  embedding USER-DEFINED,
  CONSTRAINT rules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schemes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  benefit_summary text,
  official_link text,
  tags ARRAY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT schemes_pkey PRIMARY KEY (id)
);