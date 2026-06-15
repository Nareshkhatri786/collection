# Property Collection Management System — Backend

## Prerequisites
- Node.js 18+
- MySQL 8.0+

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
copy .env.example .env
```
Edit `.env` and set your MySQL credentials:
```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/property_collection"
JWT_SECRET="any-random-32-character-string"
```

### 3. Create the database
In MySQL Workbench or terminal:
```sql
CREATE DATABASE property_collection CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run migrations
```bash
npx prisma migrate dev --name init
```

### 5. Seed demo data
```bash
npm run db:seed
```

### 6. Start development server
```bash
npm run dev
```
Server runs at: http://localhost:5000

---

## Demo Login Credentials

| Role      | Email                          | Password   |
|-----------|--------------------------------|------------|
| Admin     | admin@propertysystem.com       | Admin@123  |
| Staff     | staff@propertysystem.com       | Staff@123  |
| Developer | developer@propertysystem.com   | Dev@123    |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Current user |
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| GET | /api/units | List units |
| POST | /api/units/bulk | Bulk create units |
| GET | /api/clients | List clients |
| POST | /api/clients | Create client |
| POST | /api/deals | Create deal (with full validation) |
| GET | /api/deals/:id | Get deal details |
| POST | /api/deals/:id/registry | Update registry status |
| POST | /api/collections/margin/:id/receive | Mark margin payment received |
| POST | /api/collections/loan/:id/receive | Mark loan disbursement received |
| POST | /api/cash/:id/receive | Mark cash installment received |
| GET | /api/reports/monthly-projection | Monthly projection report |
| GET | /api/reports/month-end-achievement | Month-end achievement |
| GET | /api/reports/unit-wise-status | Unit-wise status |
| GET | /api/reports/extra-work | Extra work report |
| GET | /api/alerts | All alerts for current user |
| GET | /api/audit-logs | Audit log (admin only) |

Add `?pdf=true` to any report endpoint to download a PDF.

---

## GST Rules (Auto-calculated)

| Condition | GST Rate |
|-----------|----------|
| Project = READY | 0% (NIL) |
| Under Construction + Deal ≤ ₹45 Lakh | 1% |
| Under Construction + Deal > ₹45 Lakh | 5% |

Stamp Duty is always **5.9%** of Deal Amount.
