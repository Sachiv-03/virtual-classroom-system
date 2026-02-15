# Virtual Classroom Backend

This is the Node.js backend for the Virtual Classroom System, using Express and MongoDB.

## Features
- User Authentication (Login / Signup)
- Password Reset via Email OTP
- Role-based Access (Student / Teacher)
- Protected Routes Middleware

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configuration**:
   Update the `.env` file with your MongoDB URI and Email credentials.

3. **Seed Data (Optional)**:
   To create a test student and teacher:
   ```bash
   npm run seed
   ```
   - **Student**: `student@example.com` / `password123`
   - **Teacher**: `teacher@example.com` / `password123`

4. **Run Server**:
   ```bash
   npm run dev
   ```

## API Endpoints
- `POST /api/auth/register` - Create a new account
- `POST /api/auth/login` - Login to account
- `POST /api/auth/forgotpassword` - Send OTP for password reset
- `POST /api/auth/resetpassword` - Reset password with OTP
