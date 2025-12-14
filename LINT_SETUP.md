# Lint and Formatting System - Cash Found Frontend

This project is configured with a complete code linting and formatting system using **ESLint** and **Prettier**, ensuring strict code standardization across all TypeScript, React, JSX, and TSX code.

---

## 📋 Implemented Configurations

### 1. **Quotes**

- ✅ **Double quotes** in JSX and TSX properties
- ✅ **Single quotes** in all TypeScript and JavaScript code
- Template literals allowed when necessary

### 2. **Semicolons**

- ✅ **Mandatory** semicolon usage throughout the project

### 3. **Tailwind CSS**

- ✅ Classes automatically sorted following official Tailwind order
- ✅ Works in `className`, `cn()`, `clsx()` and equivalent utilities
- ✅ Integrated `prettier-plugin-tailwindcss` plugin

### 4. **Next.js**

- ✅ Official Next.js ESLint base configuration
- ✅ Full compatibility with App Router, Server Components, and Client Components
- ✅ No rules that conflict with Next.js best practices

### 5. **Import Sorting**

- ✅ Imports automatically sorted by groups
- ✅ Blank lines separating each import type
- ✅ Group order:
  1. Side effects (`import './styles.css'`)
  2. React and Next.js (`react`, `next`)
  3. External packages from node_modules
  4. Internal imports with `@/` alias
  5. Parent directory imports (`../`)
  6. Sibling directory imports (`./`)
  7. CSS style imports

---

## 🚀 Available Scripts

### Run Lint

```bash
npm run lint
```

Checks all files without making changes.

### Lint with Auto-Fix

```bash
npm run lint:fix
```

Automatically fixes all correctable errors.

### Complete Formatting

```bash
npm run format
```

Formats all project files with Prettier.

### Format Check

```bash
npm run format:check
```

Checks if files are correctly formatted without changing them.

### Complete Check

```bash
npm run check
```

Runs typecheck + lint + format:check in sequence.

---

## 📦 Installed Dependencies

### ESLint

- `eslint` - Main linter
- `eslint-config-next` - Official Next.js configuration
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `@typescript-eslint/eslint-plugin` - TypeScript rules
- `eslint-plugin-react` - React rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-jsx-a11y` - Accessibility rules
- `eslint-plugin-simple-import-sort` - Import sorting
- `@next/eslint-plugin-next` - Next.js plugin
- `globals` - Global variable definitions

### Prettier

- `prettier` - Code formatter
- `prettier-plugin-tailwindcss` - Tailwind class sorting
- `eslint-config-prettier` - Disables conflicting rules with Prettier
- `eslint-plugin-prettier` - Runs Prettier as ESLint rule

---

## ⚙️ Configuration Files

### `eslint.config.mjs`

Modern ESLint configuration (flat config) with:

- TypeScript and React support
- Next.js integration
- Automatic import sorting
- Code style rules
- Browser and Node.js global variables

### `.prettierrc.json`

Prettier configuration:

```json
{
  "semi": true, // Mandatory semicolons
  "singleQuote": true, // Single quotes in code
  "jsxSingleQuote": false, // Double quotes in JSX
  "trailingComma": "all", // Always trailing comma
  "printWidth": 100, // Maximum line width
  "tabWidth": 2, // 2-space indentation
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### `.prettierignore`

Files ignored in formatting:

- `node_modules/`
- `.next/`
- `build/`, `dist/`, `out/`
- Minified files
- Lock files

---

## 🎯 Main Rules

### TypeScript

- ✅ Unused variables must start with `_`
- ⚠️ Warning for `any` usage (non-blocking)
- ⚠️ Warning for non-null assertions (`!`)
- ✅ Prefer `const` over `let`
- ✅ No `var` usage

### Code

- ✅ Template literals preferred over concatenation
- ✅ Arrow functions preferred
- ✅ Mandatory object shorthand
- ✅ No multiple spaces
- ✅ No trailing spaces
- ✅ Blank line at end of files

### React

- ✅ Mandatory Hooks rules
- ⚠️ Warning for excessive dependencies
- ✅ Automatic React import (no need to import)
- ✅ PropTypes disabled (using TypeScript)

### Imports

- ✅ Automatic sorting by groups
- ✅ Alphabetically sorted exports
- ✅ Blank lines between groups

---

## 🔧 Editor Integration

### VSCode (Recommended)

Install extensions:

- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

---

## 📊 Current Status

✅ **0 errors** - All critical errors fixed
⚠️ **14 warnings** - Non-blocking warnings (mostly `any` types and non-null assertions)

Existing warnings are intentional and don't prevent code functionality. They're alerts for optional future improvements.

---

## 🎨 Formatted Code Example

```typescript
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser } from '@/firebase';

import './styles.css';

const formSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
});

export function MyComponent() {
  const { user } = useUser();
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <div className="flex items-center justify-center rounded-lg bg-white p-4 shadow-md">
      <Button variant="primary" size="lg">
        Save
      </Button>
    </div>
  );
}
```

---

## 🚨 Troubleshooting

### Error: "ESLint couldn't find config file"

Run: `npm install` to ensure all dependencies are installed.

### Imports not being sorted

Run: `npm run lint:fix` to apply automatic sorting.

### Tailwind classes not being sorted

Run: `npm run format` to apply Prettier formatting.

### Conflict between ESLint and Prettier

Check if `eslint-config-prettier` is installed. It's already configured to disable conflicting rules.

---

## 📝 Notes

- The system is **non-obstructive**: Only warnings don't prevent builds
- **Auto-fix**: Most issues are automatically corrected
- **CI/CD Ready**: Can be integrated into CI/CD pipelines
- **TypeScript First**: Configured to maximize TypeScript benefits
- **Next.js Optimized**: Follows all Next.js 15 best practices

---

## 🔄 Maintenance

To update lint dependencies:

```bash
npm update eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

To add new rules, edit `eslint.config.mjs` and add them in the `rules` section.

---

**Last updated**: December 2024
**Next.js Version**: 15.5.9
**ESLint Version**: 9.39.2
**Prettier Version**: 3.7.4
