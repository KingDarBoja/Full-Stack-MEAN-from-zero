# Complete Full-Stack MEAN Monorepo Setup Guide

## Nx + Angular 22 + Express + NestJS + MongoDB + NgRx + Node 24 LTS

This guide provides a complete, step-by-step walkthrough for initializing, configuring, and building a full-stack MEAN application inside an Nx monorepo using **Node 24 LTS**, **pnpm**, **Angular 22**, **Express.js (powered by esbuild)**, **NestJS**, **MongoDB/Mongoose**, and **NgRx**.

---

## Architecture Overview & Monorepo Structure

This project adopts **Strategy 1 (Application-Centric Co-location)** to group application source code and E2E test suites within dedicated parent application folders under `apps/`:

```text
fullstack-mean-from-zero/
├── apps/
│   ├── web-angular/                  # Angular 22 Application Boundary
│   │   ├── app/                      # Angular Client Source Code (web-angular)
│   │   │   ├── src/
│   │   │   ├── proxy.express.conf.json
│   │   │   ├── proxy.nest.conf.json
│   │   │   └── project.json
│   │   └── e2e/                      # Cypress E2E Suite (web-angular-e2e)
│   │
│   ├── api-express/                  # Express Application Boundary (Port 3333)
│   │   ├── app/                      # Express App Source Code (api-express)
│   │   │   ├── src/
│   │   │   └── project.json
│   │   └── e2e/                      # Express E2E Suite (api-express-e2e)
│   │
│   └── api-nest/                     # NestJS Application Boundary (Port 3334)
│       ├── app/                      # NestJS App Source Code (api-nest)
│       │   ├── src/
│       │   └── project.json
│       └── e2e/                      # NestJS E2E Suite (api-nest-e2e)
│
└── libs/
    └── users/                        # Users Domain Scope (DDD)
        ├── shared/
        │   └── models/               # Shared TypeScript DTOs & Interfaces
        └── backend/
            └── api/                  # Backend Routers, Services & Mongoose Schemas
```

### Tech Stack

- **Monorepo Engine:** Nx (Integrated Monorepo layout)
- **Package Manager:** `pnpm` (configured with strict symlinks and script approvals)
- **Runtime & Environment:** Node.js 24 LTS via `nvm-windows`
- **Frontend App (`apps/web-angular`):**
  - **Framework:** Angular 22 (Standalone Components)
  - **Bundler:** esbuild / Vite
  - **State Management:** NgRx Store, Effects, DevTools
  - **Unit Testing:** Jest (`@nx/jest`)
  - **E2E Testing:** Cypress (`@nx/cypress`)
- **Express Backend API (`apps/api-express`):**
  - **Framework:** Express.js generated via `@nx/node:app`
  - **Bundler:** native `esbuild` (`@nx/esbuild`)
  - **Unit Testing:** Jest with Supertest
- **NestJS Backend API (`apps/api-nest`):**
  - **Framework:** NestJS generated via `@nx/nest`
  - **Bundler:** `tsc` / Webpack
  - **Unit Testing:** Jest with Supertest
- **Database:** MongoDB with Mongoose ORM
- **Domain-Driven Design (DDD) Libraries (`libs/`):**
  - `libs/users/shared/models`: Shared TypeScript interfaces (`User`, `CreateUserDto`)
  - `libs/users/backend/core`: Shared Mongoose schemas, database connections, and business logic
  - `libs/users/backend/api`: Express router and controller handlers

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

> ⚠️ **Crucial Note on Nx Directory Resolution**  
> Modern versions of Nx no longer automatically generate empty `apps/` or `libs/` directories in a fresh workspace. If a generator runs in a workspace without an existing `apps/` folder, it assumes folder-less generation and will drop application files directly into the workspace root.  
>
> To prevent root directory pollution and maintain clean domain boundaries, always pass explicit target paths via the `--directory` flag as shown in the steps below.

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

## Step 3: Generate the Angular 22 Frontend Application (`web-angular`)

Install the `@nx/angular` plugin and generate the frontend in `apps/web-angular/app`:

```bash
# Install Angular plugin
pnpm add -D @nx/angular

# Generate application using Strategy 1 co-location
npx nx g @nx/angular:app app \
  --directory=apps/web-angular/app \
  --name=web-angular \
  --unitTestRunner=jest \
  --e2eTestRunner=cypress \
  --bundler=esbuild \
  --routing=true \
  --style=scss \
  --strict=true
```

If Nx places the Cypress E2E app in a default directory, move and rename it using the Nx move generator:

```bash
npx nx g move --projectName web-angular-e2e --destination apps/web-angular/e2e --newProjectName web-angular-e2e
```

### Fix TypeScript Module Resolution for Testing

To fix `@angular/core/testing` import issues under `pnpm`, update `tsconfig.base.json` (or `apps/web-angular/app/tsconfig.json`) to use `bundler` module resolution:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  }
}
```

---

## Step 4: Generate the Express.js Backend Application (`api-express`)

> **Note:** To avoid legacy Webpack lock-in from `@nx/express`, use the core `@nx/node:app` generator with `express` + `esbuild` targeting `apps/api-express/app`.

```bash
# Install Node plugin
pnpm add -D @nx/node

# Generate Express backend with esbuild
npx nx g @nx/node:app app \
  --directory=apps/api-express/app \
  --name=api-express \
  --framework=express \
  --bundler=esbuild \
  --unitTestRunner=jest \
  --e2eTestRunner=jest
```

If moving an existing `backend` app into Strategy 1 co-location:

```bash
npx nx g move --projectName backend --destination apps/api-express/app --newProjectName api-express
npx nx g move --projectName backend-e2e --destination apps/api-express/e2e --newProjectName api-express-e2e
```

---

## Step 5: Generate the NestJS Backend Application (`api-nest`)

Install `@nx/nest` and generate the NestJS implementation targeting port `3334`:

```bash
# Install NestJS plugin
pnpm add -D @nx/nest

# Generate NestJS application
npx nx g @nx/nest:app app \
  --directory=apps/api-nest/app \
  --name=api-nest \
  --unitTestRunner=jest \
  --e2eTestRunner=jest
```

If necessary, align the E2E directory path:

```bash
npx nx g move --projectName api-nest-e2e --destination apps/api-nest/e2e --newProjectName api-nest-e2e
```

Update `apps/api-nest/app/src/main.ts` to listen on port **3334**:

```typescript
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3334;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
```

---

## Step 6: Configure Dual Development Proxies

Create `apps/web-angular/app/proxy.express.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3333",
    "secure": false
  }
}
```

Create `apps/web-angular/app/proxy.nest.conf.json`:

```json
{
  "/api": {
    "target": "http://localhost:3334",
    "secure": false
  }
}
```

Link both proxy configurations in `apps/web-angular/app/project.json` under `targets.serve.configurations`:

```json
"serve": {
  "executor": "@angular/build:dev-server",
  "options": {
    "proxyConfig": "apps/web-angular/app/proxy.express.conf.json"
  },
  "configurations": {
    "development": {
      "proxyConfig": "apps/web-angular/app/proxy.express.conf.json"
    },
    "nest": {
      "proxyConfig": "apps/web-angular/app/proxy.nest.conf.json"
    }
  }
}
```

---

## Step 7: Create Domain Libraries (User Domain DDD)

Generate shared model and backend domain logic libraries:

```bash
# 1. Create Shared Models Library
npx nx g @nx/js:lib libs/users/shared/models

# 2. Create Backend Domain API Library
npx nx g @nx/js:lib libs/users/backend/api
```

---

## Step 8: Define Shared User Interfaces

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

## Step 9: Configure MongoDB & Mongoose CRUD API

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

In `apps/api-express/app/src/main.ts`:

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

## Step 10: Configure NgRx State Management

Install NgRx dependencies:

```bash
pnpm add @ngrx/store @ngrx/effects @ngrx/store-devtools
```

Generate root NgRx state setup targeting Standalone `app.config.ts`:

```bash
npx nx g @nx/angular:ngrx root --root --parent=apps/web-angular/app/src/app/app.config.ts
```

---

## Step 11: Running and Testing the Workspace

### Serve Applications

```bash
# Serve Express backend (Port 3333)
npx nx serve api-express

# Serve NestJS backend (Port 3334)
npx nx serve api-nest

# Serve Angular frontend connected to Express (default)
npx nx serve web-angular

# Serve Angular frontend connected to NestJS
npx nx serve web-angular --configuration=nest
```

### Run Unit and E2E Tests

```bash
# Unit tests
npx nx test web-angular
npx nx test api-express
npx nx test api-nest

# E2E tests
npx nx e2e web-angular-e2e
npx nx e2e api-express-e2e
npx nx e2e api-nest-e2e
```
