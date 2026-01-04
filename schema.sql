-- Chats Table
create table public.chats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages Table
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid references public.chats(id) on delete cascade not null,
  role text check (role in ('user', 'ai')),
  content text not null,
  meta jsonb, -- For storing action data like { "type": "navigate", "payload": "/ledger" }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Optional but recommended)
alter table public.chats enable row level security;
create policy "Users can view their own chats" on public.chats
  for select using (auth.uid() = user_id);
create policy "Users can insert their own chats" on public.chats
  for insert with check (auth.uid() = user_id);

alter table public.messages enable row level security;
create policy "Users can view messages in their chats" on public.messages
  for select using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
create policy "Users can insert messages in their chats" on public.messages
  for insert with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );
