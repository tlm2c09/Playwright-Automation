import { faker } from '@faker-js/faker';
import { IssuePayload } from '../services/IssueService';

export class IssueFactory {
  static createIssueInfo() : IssuePayload{
    return {
        title: faker.lorem.sentence(),
        body: faker.lorem.paragraphs(2),
        labels: ['bug', 'improvement'],
    }
  }
}