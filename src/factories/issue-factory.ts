import { faker } from '@faker-js/faker';
import { IssuePayload } from '../services/issue-service';

export class IssueFactory {
  static createIssueInfo() : IssuePayload{
    return {
        title: faker.lorem.sentence() + ' ' + new Date().toDateString(),
        body: faker.lorem.paragraphs(2),
        labels: ['bug', 'improvement'],
    }
  }
}