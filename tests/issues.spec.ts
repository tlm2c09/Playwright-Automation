import { test, expect } from '../src/fixtures/test'; // Import from OUR fixture
import { IssueFactory } from '../src/factories/issue-factory';
import { IssueSchema } from '../src/schemas/issue-schema';
import '../src/lib/expectSchema'; // To load toMatchSchema
import { OWNER, REPO } from '../src/constants/general-constants';

test.describe('GitHub Issues API', () => {

  test('should create an issue and validate the schema', async ({ issueService }) => {
    // 1. Prepare Data (Factory)
    const issueData = IssueFactory.createIssueInfo();

    // 2. Perform Action (Service)
    const response = await issueService.createIssue(OWNER, REPO, issueData);

    // 3. Check Status
    expect(response.status(), 'Expected 201 Created').toBe(201);

    // 4. Validate Schema (Contract)
    const body = await response.json();
    expect(body).toMatchSchema(IssueSchema);

    // 5. Verify Logic (Data Integrity)
    expect(body.title).toBe(issueData.title);
    expect(body.state).toBe('open');
  });

});