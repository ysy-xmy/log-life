# Supabase 配置说明

## 环境变量设置

请在项目根目录创建 `.env.local` 文件，并添加以下环境变量：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 获取 Supabase 配置信息

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 在左侧菜单中点击 "Settings" > "API"
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 数据库表结构

需要在 Supabase 中创建以下表：

### 1. logs 表
```sql
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  mood TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. accounting 表
```sql
CREATE TABLE accounting (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. users 表
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 行级安全策略 (RLS)

为了数据安全，建议启用行级安全策略：

```sql
-- 启用 RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略（示例，需要根据实际认证方式调整）
CREATE POLICY "Users can view own logs" ON logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON logs
  FOR DELETE USING (auth.uid() = user_id);
```

## 使用说明

配置完成后，可以在组件中导入并使用：

```javascript
import { supabase, logService, accountingService } from '@/lib/supabase'

// 使用示例
const logs = await logService.getLogs(userId)
const newLog = await logService.createLog(logData)
```
