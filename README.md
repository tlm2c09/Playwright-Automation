# Playwright Testing Framework with TypeScript

A robust, scalable testing framework built with Playwright, TypeScript, and Zod for schema validation. This framework supports both **API testing** and **browser automation**, following industry best practices with a layered architecture for maintainability and extensibility.

---

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Layers & Responsibilities](#layers--responsibilities)
- [Workflow](#workflow)
- [Coding Conventions](#coding-conventions)
- [Getting Started](#getting-started)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

---

## 🏛️ Architecture Overview

This framework implements a **4-Layer Architecture** pattern:

```
┌─────────────────────────────────────┐
│         TEST LAYER                  │  ← Tests orchestrate business flows
│   (tests/example.spec.ts)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       FIXTURE LAYER                 │  ← Dependency injection & cleanup
│   (src/fixtures/test.ts)            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       SERVICE LAYER                 │  ← Business logic & API endpoints
│   (src/services/IssueService.ts)    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       INFRASTRUCTURE LAYER          │  ← HTTP client, logging, utilities
│   (src/lib/ApiClient.ts, Logger.ts) │
└─────────────────────────────────────┘
```

### Supporting Components
- **Factories** → Generate test data dynamically
- **Schemas** → Contract validation with Zod
- **Custom Matchers** → Extend Playwright assertions

---

## 📁 Project Structure

```
playwright/
├── .env                          # Environment variables (GITHUB_TOKEN)
├── .gitignore                    # Exclude logs, .env, node_modules
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
├── playwright.config.ts          # Playwright settings (base URL, auth)
├── global.d.ts                   # TypeScript global declarations
│
├── src/                          # Source code (framework logic)
│   ├── fixtures/                 # Test fixtures (dependency injection)
│   │   └── test.ts               # Custom fixtures for services
│   │
│   ├── services/                 # API service layer
│   │   └── IssueService.ts       # GitHub Issues API operations
│   │
│   ├── lib/                      # Core utilities
│   │   ├── ApiClient.ts          # HTTP client wrapper
│   │   ├── Logger.ts             # Winston logger
│   │   └── ToMatchSchema.ts      # Custom Zod matcher
│   │
│   ├── factories/                # Test data generators
│   │   └── IssueFactory.ts       # Generates Issue payloads
│   │
│   └── schemas/                  # Zod validation schemas
│       └── IssueSchema.ts        # GitHub Issue response schema
│
├── tests/                        # Test specs
│   └── example.spec.ts           # Sample test file
│
└── logs/                         # Auto-generated logs
    ├── combined.log              # All logs
    └── error.log                 # Errors only
```

---

## 🧩 Core Components

### 1. **ApiClient** (`src/lib/ApiClient.ts`)
The **HTTP client wrapper** that all services extend from.

**Responsibilities:**
- Centralized HTTP operations (`GET`, `POST`, `DELETE`)
- Automatic request/response logging via Winston
- Error handling and status code logging

**Example:**
```typescript
export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async sendPostRequest(path: string, data: any): Promise<APIResponse> {
    const response = await this.request.post(path, { data });
    await this.logRequest('POST', path, data, response);
    return response;
  }
}
```

---

### 2. **Services** (`src/services/`)
The **business logic layer** containing domain-specific API operations.

**Responsibilities:**
- Define API endpoint methods
- Extend `ApiClient` for HTTP operations
- Return `APIResponse` objects (not parsed JSON)

**Example:**
```typescript
export class IssueService extends ApiClient {
  async createIssue(owner: string, repo: string, payload: IssuePayload) {
    return this.sendPostRequest(`/repos/${owner}/${repo}/issues`, payload);
  }
}
```

**Why not return JSON?**  
Returning `APIResponse` allows tests to:
- Check status codes (`response.status()`)
- Validate headers
- Parse JSON conditionally

---

### 3. **Fixtures** (`src/fixtures/test.ts`)
The **dependency injection layer** using Playwright's fixture system.

**Responsibilities:**
- Instantiate and inject services into tests
- Automatic cleanup/teardown (close issues, delete resources)
- Intercept service methods for resource tracking

**Example:**
```typescript
export const test = base.extend<MyFixtures>({
  issueService: async ({ request }, use) => {
    const service = new IssueService(request);
    const createdIssues = [];
    
    // Wrap createIssue to track created resources
    service.createIssue = async (...args) => {
      const response = await originalCreate(...args);
      if (response.ok()) {
        createdIssues.push(await response.json());
      }
      return response;
    };
    
    await use(service);
    
    // Auto-cleanup
    for (const issue of createdIssues) {
      await service.closeIssue(issue.owner, issue.repo, issue.number);
    }
  }
});
```

**Benefits:**
- No manual cleanup in tests
- Test isolation guaranteed
- Reusable across all specs

---

### 4. **Factories** (`src/factories/`)
The **test data generation layer** using Faker.js.

**Responsibilities:**
- Generate realistic, randomized test data
- Avoid hardcoded values
- Ensure test uniqueness (no conflicts)

**Example:**
```typescript
export class IssueFactory {
  static createIssueInfo(): IssuePayload {
    return {
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(2),
      labels: ['bug', 'enhancement']
    };
  }
}
```

**When to use:**
- Creating API request payloads
- Generating dynamic test scenarios
- Avoiding flaky tests caused by duplicate data

---

### 5. **Schemas** (`src/schemas/`)
The **contract validation layer** using Zod.

**Responsibilities:**
- Define expected API response structures
- Validate data types, required fields, enums
- Catch breaking changes in API contracts

**Example:**
```typescript
export const IssueSchema = z.object({
  id: z.number(),
  title: z.string(),
  state: z.enum(['open', 'closed']),
  user: z.object({
    login: z.string(),
    id: z.number()
  }),
  created_at: z.iso.datetime()
});
```

**Usage in tests:**
```typescript
expect(response).toMatchSchema(IssueSchema);
```

---

### 6. **Logger** (`src/lib/Logger.ts`)
The **logging infrastructure** using Winston.

**Features:**
- **Console logs**: Colored, human-readable
- **File logs**: 
  - `combined.log` (all levels)
  - `error.log` (errors only)
- **Log rotation**: 5MB max, 5 files retained
- **Configurable levels**: `error`, `warn`, `info`, `debug`

**Usage:**
```typescript
const logger = new Logger('TestName');
logger.info('Test started');
logger.error('API call failed', error);
```

---

## 🔄 Workflow

### Test Execution Flow

```
1. Test Initialization
   ↓
2. Fixture Setup (issueService injected)
   ↓
3. Factory generates test data
   ↓
4. Service calls API (via ApiClient)
   ↓
5. ApiClient logs request/response
   ↓
6. Test validates:
   - Status code
   - Schema (Zod)
   - Business logic
   ↓
7. Fixture Teardown (auto-cleanup)
   ↓
8. Test Complete
```

### Example Test Breakdown

```typescript
test('should create an issue', async ({ issueService }) => {
  // 1. ARRANGE: Generate test data
  const issueData = IssueFactory.createIssueInfo();

  // 2. ACT: Perform API operation
  const response = await issueService.createIssue('owner', 'repo', issueData);

  // 3. ASSERT: Validate results
  expect(response.status()).toBe(201);                    // Status code
  expect(await response.json()).toMatchSchema(IssueSchema); // Schema
  expect(body.title).toBe(issueData.title);               // Business logic

  // 4. CLEANUP: Automatic (handled by fixture)
});
```

---

## 📜 Coding Conventions

### File Naming
- **Services**: `{entity}-service.ts` (kebab-case) → `issue-service.ts`
- **Factories**: `{entity}-factory.ts` (kebab-case) → `issue-factory.ts`
- **Schemas**: `{entity}-schema.ts` (kebab-case) → `issue-schema.ts`
- **Tests**: `{feature}.spec.ts` (kebab-case) → `issues.spec.ts`
- **Utilities/Lib**: `{purpose}.ts` (kebab-case) → `api-client.ts`, `expect-schema.ts`

### Class & Method Naming
- **Classes**: PascalCase → `IssueService`, `ApiClient`
- **Methods**: camelCase → `createIssue()`, `getIssues()`, `sendPostRequest()`
- **Constants**: UPPER_SNAKE_CASE → `GITHUB_TOKEN`, `BASE_URL`, `OWNER`, `REPO`
- **Interfaces**: PascalCase with I prefix optional → `IssuePayload` or `RequestOptions`

### Imports Order
```typescript
// 1. External libraries
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { APIRequestContext, APIResponse } from '@playwright/test';

// 2. Framework components (lib, services, factories)
import { IssueService } from '../services/issue-service';
import { IssueFactory } from '../factories/issue-factory';
import { ApiClient } from '../lib/api-client';

// 3. Schemas & constants
import { IssueSchema } from '../schemas/issue-schema';
import { OWNER, REPO } from '../constants/general-constants';

// 4. Custom extensions (e.g., matchers)
import '../lib/expectSchema';
```

### TypeScript Best Practices
- ✅ Use `interface` for data structures (especially API payloads and responses)
- ✅ Use `type` for unions, intersections, and type aliases
- ✅ Enable strict mode in `tsconfig.json` for type safety
- ✅ Avoid `any` (use `unknown` if necessary, but prefer specific types)
- ✅ Export types and interfaces alongside implementations
- ✅ Add JSDoc comments for public methods with parameters and return types
- ✅ Use private/protected modifiers for internal methods (e.g., `buildEndpoint()`)

### Code Organization
- **Services**: Keep endpoint building logic separate via private methods (e.g., `buildIssuesEndpoint()`)
- **Factories**: Use `static` methods for creating test data
- **Spacing**: 2-space indentation for consistency with existing code

----

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18
npm >= 9
```

### CI/CD Setup (GitHub Actions)

This project includes a comprehensive GitHub Actions workflow (`.github/workflows/api-regression-tests.yml`) designed for automated regression testing.

**Workflow Steps:**
1.  **Trigger**: Runs automatically Mon-Fri at 00:00 UTC, or can be triggered manually.
2.  **Setup**: Configures Node.js environment and installs dependencies.
3.  **Test Execution**: Runs the full Playwright API test suite.
4.  **Reporting**: Uploads the HTML test report as a build artifact (retained for 7 days).
5.  **Notification**: Sends a status update to Slack with a direct link to the results.

**Required Secrets:**
To enable the workflow and notifications, add the following secrets in your GitHub repository settings:

| Secret Name | Description | Required For |
| :--- | :--- | :--- |
| `GH_PAT` | GitHub Personal Access Token for API authentication | Running Tests |
| `SLACK_WEBHOOK` | Slack Incoming Webhook URL | Slack Notifications |

### Installation
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Setup
Create a `.env` file in the root:
```env
GITHUB_TOKEN=your_github_personal_access_token
LOG_LEVEL=info
```

**Get a GitHub Token:**  
GitHub Settings → Developer Settings → Personal Access Tokens → Generate New Token  
(Scopes required: `repo`, `read:org`)

### Run Tests
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/example.spec.ts

# Run with UI mode
npx playwright test --ui

# Show report
npx playwright show-report
```

---

## ✍️ Writing Tests

### 1. Define Your Service
```typescript
// src/services/ProductService.ts
export class ProductService extends ApiClient {
  async getProducts(): Promise<APIResponse> {
    return this.sendGetRequest('/products');
  }
}
```

### 2. Create Factory
```typescript
// src/factories/ProductFactory.ts
export class ProductFactory {
  static createProduct() {
    return {
      name: faker.commerce.productName(),
      price: faker.number.float({ min: 10, max: 1000 })
    };
  }
}
```

### 3. Define Schema
```typescript
// src/schemas/ProductSchema.ts
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().positive()
});
```

### 4. Register Fixture
```typescript
// src/fixtures/test.ts
export const test = base.extend<MyFixtures>({
  productService: async ({ request }, use) => {
    await use(new ProductService(request));
  }
});
```

### 5. Write Test
```typescript
// tests/products.spec.ts
import { test, expect } from '../src/fixtures/test';
import { ProductSchema } from '../src/schemas/ProductSchema';

test('should get products', async ({ productService }) => {
  const response = await productService.getProducts();
  expect(response.status()).toBe(200);
  
  const products = await response.json();
  expect(products[0]).toMatchSchema(ProductSchema);
});
```

---

## 🎯 Best Practices

### 1. Test Independence
- Each test should run in isolation
- Use fixtures for automatic cleanup
- Never rely on test execution order

### 2. Data Management
- Use factories for all test data
- Avoid hardcoded values in tests
- Generate unique identifiers

### 3. Assertions
```typescript
// ✅ Good: Specific assertions
expect(response.status()).toBe(201);
expect(body.title).toContain('Bug:');
expect(body.labels).toHaveLength(2);

// ❌ Bad: Generic assertions
expect(response.ok()).toBeTruthy();
expect(body).toBeDefined();
```

### 4. Error Handling
```typescript
// ✅ Good: Check status first
if (!response.ok()) {
  logger.error(`API failed: ${await response.text()}`);
  throw new Error('API call failed');
}

// ❌ Bad: Assume success
const data = await response.json(); // May crash if 404
```

### 5. Schema Validation
```typescript
// ✅ Good: Validate structure first
expect(body).toMatchSchema(IssueSchema);
expect(body.title).toBe(expectedTitle);

// ❌ Bad: Skip schema validation
expect(body.title).toBe(expectedTitle); // May crash if shape changes
```

### 6. Logging Strategy
- **info**: Test milestones, API calls
- **debug**: Request/response payloads
- **error**: Failures, exceptions
- **warn**: Unexpected but non-critical issues

---

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'https://api.github.com',
    extraHTTPHeaders: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
    }
  }
});
```

### TypeScript Config (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "types": ["@playwright/test"]
  },
  "include": ["src/**/*", "tests/**/*", "global.d.ts"]
}
```

---

## 📊 Logs & Reports

### Logs Location
```
logs/
├── combined.log    # All logs (info, warn, error, debug)
└── error.log       # Errors only
```

### Playwright Reports
```bash
# Generate HTML report
npx playwright show-report

# JSON reporter
npx playwright test --reporter=json
```

---

## 🤝 Contributing

### Adding New API Endpoints
1. Create method in Service class
2. Add schema in `schemas/`
3. Create factory if needed
4. Write tests using fixtures

### Extending ApiClient
```typescript
async sendPatchRequest(path: string, data: any) {
  const response = await this.request.patch(path, { data });
  await this.logRequest('PATCH', path, data, response);
  return response;
}
```

---

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Zod Documentation](https://zod.dev/)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Winston Logging](https://github.com/winstonjs/winston)

---

## 📝 License

This project is licensed under the MIT License - feel free to use it as a reference or template for your own testing frameworks.

---

## 👥 Support

This is a reference implementation of a comprehensive testing framework built with Playwright and TypeScript, supporting both API testing and browser automation. Feel free to fork, modify, and use as a template for your own projects. For issues or questions, please create an issue in the repository.
