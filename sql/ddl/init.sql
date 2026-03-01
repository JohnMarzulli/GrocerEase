-- GrocerEase SQL DDL (Azure SQL compatible)
-- Creates lists and items tables with indexes and constraints

CREATE TABLE dbo.lists
(
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    updated_at DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    is_public BIT DEFAULT 0
);

CREATE TABLE dbo.items
(
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    list_id UNIQUEIDENTIFIER NOT NULL REFERENCES dbo.lists(id) ON DELETE CASCADE,
    name NVARCHAR(255) NOT NULL,
    qty INT NOT NULL DEFAULT 1,
    unit NVARCHAR(30) NOT NULL DEFAULT 'ea',
    status NVARCHAR(20) NOT NULL CHECK (status IN ('pending','completed', 'unavailable')),
    position INT NOT NULL,
    created_at DATETIMEOFFSET DEFAULT SYSUTCDATETIME(),
    updated_at DATETIMEOFFSET DEFAULT SYSUTCDATETIME()
);

CREATE UNIQUE INDEX IX_items_list_position ON dbo.items(list_id, position);

-- Notes:
-- 1) Use `updated_at` for last-write-wins sync logic on the client.
-- 2) Consider adding auditing/soft-delete columns if you need history or undo.

CREATE USER [fa-grocerease] FROM EXTERNAL PROVIDER
ALTER ROLE db_datareader ADD MEMBER [fa-grocerease]
ALTER ROLE db_datawriter ADD MEMBER [fa-grocerease]