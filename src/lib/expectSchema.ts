import { expect } from '@playwright/test';
import { z, ZodType } from 'zod';

/**
 * A matcher that checks if the received value matches the provided Zod schema.
 * It returns a Playwright matcher object with a custom message if the validation fails.
 * @param received - The value to validate against the schema
 * @param schema - The Zod schema to validate against
 * @returns A matcher object with a custom error message
 */
export const toMatchSchema = (received: any, schema: ZodType) => {
  const result = schema.safeParse(received);

  if (result.success) {
    return {
      message: () => 'expected value not to match schema',
      pass: true,
    };
  } else {
    // If validation fails, we format the Zod error into a readable string
    const formattedError = JSON.stringify(z.treeifyError(result.error), null, 2);
    return {
      message: () => `Schema validation failed:\n${formattedError}`,
      pass: false,
    };
  }
};

// Register the custom matcher with Playwright's expect
expect.extend({
  toMatchSchema,
});