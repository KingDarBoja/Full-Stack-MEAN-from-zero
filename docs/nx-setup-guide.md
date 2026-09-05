# Complete Full-Stack MEAN Monorepo Setup Guide

## Nx + Angular 22 + Express + MongoDB + NgRx + Node 24 LTS

This guide provides a complete, step-by-step walkthrough for initializing, configuring, and building a full-stack MEAN application inside an Nx monorepo using **Node 24 LTS**, **pnpm**, **Angular 22**, **Express.js (powered by esbuild)**, **MongoDB/Mongoose**, and **NgRx**.

---

## Architecture Overview & Tech Stack

- **Monorepo Engine:** Nx (Integrated Monorepo layout)
- **Package Manager:** `pnpm` (configured with strict symlinks and script approvals)
- **Runtime & Environment:** Node.js 24 LTS via `nvm-windows`
- **Frontend App (`apps/frontend`):**
  - **Framework:** Angular 22 (Standalone Components)
  - **Bundler:** esbuild / Vite
  - **State Management:** NgRx Store, Effects, DevTools
  - **Unit Testing:** Jest (`@nx/jest`)
  - **E2E Testing:** Cypress (`@nx/cypress`)
- **Backend App (`apps/backend`):**
  - **Framework:** Express.js generated via `@nx/node:app`
  - **Bundler:** native `esbuild` (`@nx/esbuild`)
  - **Database:** MongoDB with Mongoose ORM
  - **Unit Testing:** Jest with Supertest
- **Domain-Driven Design (DDD) Libraries (`libs/`):**
  - `libs/users/shared/models`: Shared TypeScript interfaces (`User`, `CreateUserDto`)
  - `libs/users/backend/api`: Express routers, Mongoose schemas, and controllers

---

## Step 1: Environment & Node 24 Setup

Using `nvm-windows` in Git Bash or PowerShell (run as Administrator):

```bash
# Install and switch to Node.js 24 LTS
nvm install 24
nvm use 24

# Verify node version
node -v # Should output v24.x.x
```

---

## Step 2: Initialize Nx Monorepo Workspace

Create an integrated workspace configured specifically for `pnpm`:

```bash
npx create-nx-workspace@latest fullstack-mean-from-zero --preset=apps --pm=pnpm --nxCloud=skip
cd fullstack-mean-from-zero
```

### Authorize pnpm Build Scripts (Crucial for Windows & Nx Daemon)

`pnpm` blocks native install scripts by default. To allow Nx watcher tools (`@parcel/watcher` and `esbuild`) to build native binaries:

```bash
# Approve native build dependencies
pnpm approve-builds

# Rebuild native modules
pnpm rebuild

# Reset Nx daemon cache
npx nx reset
```

---

## Step 3: Generate the Angular 22 Frontend Application

Install the `@nx/angular` plugin and generate the frontend:

```bash
# Install Angular plugin
pnpm add -D @nx/angular

# Generate application
npx nx g @nx/angular:app frontend   --unitTestRunner=jest   --e2eTestRunner=cypress   --bundler=esbuild   --routing=true   --style=scss   --strict=true
```

### Fix TypeScript Module Resolution for Testing

To fix `@angular/core/testing` import issues under `pnpm`, update `tsconfig.base.json` (or `apps/frontend/tsconfig.json`) to use the `bundler` module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  }
}
```

---

## Step 4: Generate the Express.js Backend Application

> **Note:** To avoid legacy Webpack lock-in from `@nx/express`, we use the core `@nx/node:app` generator and select `express` + `esbuild`.

```bash
# Install Node plugin
pnpm add -D @nx/node

# Generate backend app with esbuild
npx nx g @nx/node:app backend --framework=express --bundler=esbuild
```

---

## Step 5: Configure Development Proxy

Create `apps/frontend/proxy.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3333",
    "secure": false
  }
}
```

Link the proxy in `apps/frontend/project.json` under `targets.serve.options`:

```json
"serve": {
  "executor": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "apps/frontend/proxy.conf.json"
  }
}
```

---

## Step 6: Create Domain Libraries (User Domain)

Following Nx Domain-Driven Design (DDD) principles:

```bash
# 1. Create Shared Types Library
npx nx g @nx/js:lib libs/users/shared/models

# 2. Create Backend Domain API Library
npx nx g @nx/js:lib libs/users/backend/api
```

---

## Step 7: Define Shared User Interfaces

In `libs/users/shared/models/src/index.ts`:

```typescript
export interface User {
  _id?: string;
  email: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
}
```

---

## Step 8: Configure MongoDB & Mongoose CRUD API

### 1. Install Mongoose

```bash
pnpm add mongoose
pnpm add -D @types/mongoose
```

### 2. Create User Schema

In `libs/users/backend/api/src/lib/user.schema.ts`:

```typescript
import { Schema, model } from 'mongoose';
import { User } from '@fullstack-mean-from-zero/libs/users/shared/models';

const UserSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model<User>('User', UserSchema);
```

### 3. Create Express CRUD Router

In `libs/users/backend/api/src/lib/users.router.ts`:

```typescript
import { Router } from 'express';
import { UserModel } from './user.schema';
import { CreateUserDto } from '@fullstack-mean-from-zero/libs/users/shared/models';

export const usersRouter = Router();

// CREATE
usersRouter.post('/', async (req, res) => {
  try {
    const dto: CreateUserDto = req.body;
    const newUser = new UserModel(dto);
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// READ ALL
usersRouter.get('/', async (req, res) => {
  try {
    const users = await UserModel.find().exec();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// READ ONE
usersRouter.get('/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE
usersRouter.put('/:id', async (req, res) => {
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).exec();
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(updatedUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE
usersRouter.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id).exec();
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

Export router in `libs/users/backend/api/src/index.ts`:

```typescript
export * from './lib/users.router';
```

### 4. Mount MongoDB & Router in Express App

In `apps/backend/src/main.ts`:

```typescript
import express from 'express';
import mongoose from 'mongoose';
import { usersRouter } from '@fullstack-mean-from-zero/libs/users/backend/api';

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose
  .connect('mongodb://localhost:27017/mean-stack-db')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Domain Routes
app.use('/api/users', usersRouter);

const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
```

---

## Step 9: Configure NgRx State Management

Install NgRx core packages:

```bash
pnpm add @ngrx/store @ngrx/effects @ngrx/store-devtools
```

Generate root NgRx state setup targeting Standalone `app.config.ts`:

```bash
npx nx g @nx/angular:ngrx root --root --parent=apps/frontend/src/app/app.config.ts
```

---

## Step 10: Running and Testing the Workspace

### Serve Applications

```bash
# Serve backend API (port 3333)
npx nx serve backend

# Serve frontend Angular app (port 4200, proxied to /api)
npx nx serve frontend
```

### Run Tests

```bash
# Run unit tests with Jest
npx nx test frontend
npx nx test backend

# Run E2E tests with Cypress
npx nx e2e frontend-e2e
```
