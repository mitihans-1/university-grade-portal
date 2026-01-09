# University Grade Portal

A comprehensive grade management system for universities that allows students, parents, and administrators to access academic information. The application now uses a MySQL backend for data storage.

## Features

- Student dashboard for viewing grades and academic progress
- Parent dashboard for monitoring child's academic performance
- Admin panel for grade uploads and user management
- Registration system for students and parents
- Role-based access control
- MySQL database integration
- API-based architecture

## Login Credentials

### Admin Account
- **Email**: admin@university.edu
- **Password**: admin

### Demo Accounts
- **Student**: student@university.edu / password
- **Parent**: parent@example.com / password

## Getting Started

### Backend Setup

1. Navigate to the backend directory: `cd ../backend`
2. Install dependencies: `npm install`
3. Create a MySQL database named `gradeportal`
4. Create a `.env` file in the backend root directory with the following content:
   ```
   PORT=5000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=gradeportal
   JWT_SECRET=university_grade_portal_secret_key
   ```
5. Run the SQL file `create_tables.sql` to create the database tables
6. Start the backend server: `npm run dev`

### Frontend Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`
3. Access the application at `http://localhost:3000` (or the next available port)
4. Use the login credentials above, or register as a new user

### Registration Process

- **Students**: Navigate to the registration page and enter your details to create an account
- **Parents**: Register with your details and student ID to link to a student account (requires admin approval)
- **Admin**: Admin accounts must be created by modifying the database directly

### Admin Approval

Parent accounts require admin approval before they can log in. Admins can approve parent registration requests from the admin panel.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
