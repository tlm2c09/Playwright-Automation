import { expect } from '@playwright/test';
import { z, ZodType } from 'zod';

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