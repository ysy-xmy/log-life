# 数据库迁移说明

## 添加accounting_id字段到logs表

为了支持日志与记账记录的关联功能，需要在Supabase数据库中执行以下迁移：

### ⚠️ 重要提示

如果遇到数据类型不匹配的错误，请使用 `database_migrations/add_accounting_id_to_logs_safe.sql` 文件，它会自动检测数据类型。

### 1. 执行SQL迁移脚本

**推荐使用安全版本**（在Supabase的SQL编辑器中执行）：

```sql
-- 使用 database_migrations/add_accounting_id_to_logs_safe.sql
```

**或者手动执行**：

```sql
-- 1. 为logs表添加accounting_id字段（使用uuid类型匹配accounting表的id）
ALTER TABLE logs 
ADD COLUMN IF NOT EXISTS accounting_id UUID;

-- 2. 添加外键约束
ALTER TABLE logs 
ADD CONSTRAINT fk_logs_accounting_id 
FOREIGN KEY (accounting_id) 
REFERENCES accounting(id) 
ON DELETE SET NULL;

-- 3. 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_logs_accounting_id ON logs(accounting_id);

-- 4. 添加注释
COMMENT ON COLUMN logs.accounting_id IS '关联的记账记录ID，可为空';
```

### 2. 验证迁移结果

执行以下查询验证字段是否添加成功：

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'logs' 
AND column_name = 'accounting_id';
```

### 3. 常见错误和解决方案

#### 错误：数据类型不匹配
```
ERROR: foreign key constraint cannot be implemented
DETAIL: Key columns are of incompatible types: text and uuid
```

**解决方案**：使用 `UUID` 类型匹配accounting表的id字段类型。

#### 错误：约束已存在
```
ERROR: constraint already exists
```

**解决方案**：使用 `IF NOT EXISTS` 或先删除现有约束。

### 4. 功能说明

迁移完成后，系统将支持以下功能：

- ✅ 在发布日志时自动创建关联的记账记录
- ✅ 在日志列表中显示关联的记账信息
- ✅ 日志和记账记录的双向关联
- ✅ 删除记账记录时自动解除关联（SET NULL）

### 5. 回退方案

如果迁移失败，系统会自动回退到原来的查询方式，不会影响现有功能。
