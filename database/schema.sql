-- AstraCore Database Schema for Supabase
-- Run these commands in Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'completed', 'cancelled', 'on_hold');
CREATE TYPE invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE equipment_status AS ENUM ('available', 'borrowed', 'service', 'retired');
CREATE TYPE vehicle_status AS ENUM ('active', 'service', 'retired');
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Users/Profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'employee',
    avatar_url TEXT,
    phone TEXT,
    position TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'company', -- 'company' or 'individual'
    email TEXT,
    phone TEXT,
    ico TEXT,
    dic TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    contact_person TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    client_id INTEGER REFERENCES clients(id),
    manager_id UUID REFERENCES profiles(id),
    status project_status DEFAULT 'planning',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE,
    end_date DATE,
    actual_end_date DATE,
    budget DECIMAL(12,2),
    location TEXT,
    assigned_employees UUID[],
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees table
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    position TEXT,
    start_date DATE,
    end_date DATE,
    hourly_rate DECIMAL(8,2),
    status employee_status DEFAULT 'active',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL,
    price_per_unit DECIMAL(10,2),
    current_stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment table
CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    manufacturer TEXT,
    model TEXT,
    serial_number TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    status equipment_status DEFAULT 'available',
    location TEXT,
    borrowed_by TEXT,
    borrowed_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    brand TEXT,
    model TEXT,
    year INTEGER,
    license_plate TEXT,
    vin TEXT,
    fuel_type TEXT,
    status vehicle_status DEFAULT 'active',
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    insurance_expiry DATE,
    stk_expiry DATE,
    assigned_to TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    ico TEXT,
    dic TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    contact_person TEXT,
    payment_terms INTEGER DEFAULT 30,
    status TEXT DEFAULT 'active',
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type transaction_type NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category TEXT,
    transaction_date DATE NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    note TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id),
    project_id INTEGER REFERENCES projects(id),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    status invoice_status DEFAULT 'draft',
    notes TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Diary table
CREATE TABLE project_diary (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id),
    entry_date DATE NOT NULL,
    weather TEXT,
    temperature INTEGER,
    work_description TEXT NOT NULL,
    workers_count INTEGER DEFAULT 1,
    materials_used TEXT,
    equipment_used TEXT,
    notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id),
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_worked DECIMAL(4,2),
    project_id INTEGER REFERENCES projects(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Documents table
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    project_id INTEGER REFERENCES projects(id),
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_diary ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Admin can manage everything
CREATE POLICY "Admin full access" ON profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Apply similar patterns to other tables...

-- Create indexes for performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_manager_id ON projects(manager_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_project_diary_project_id ON project_diary(project_id);
CREATE INDEX idx_project_diary_date ON project_diary(entry_date);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_diary_updated_at BEFORE UPDATE ON project_diary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
