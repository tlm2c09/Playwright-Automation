// global.d.ts
import { ZodType } from 'zod';

declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Asserts that the received object matches the provided Zod schema.
       * @param schema - The Zod schema to validate against
       */
      toMatchSchema(schema: ZodType): R;
    }
  }
}

export {};