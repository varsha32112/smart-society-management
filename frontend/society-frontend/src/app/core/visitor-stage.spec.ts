import { Visitor } from './visitor.service';
import { stageLabel, stageOf } from './visitor-stage';

const base: Visitor = {
  id: 1,
  visitorName: 'Guest',
  visitorPhone: null,
  purpose: null,
  flatId: 1,
  flatLabel: 'A-101',
  status: 'PENDING',
  entryTime: null,
  exitTime: null,
  createdAt: null
};

const make = (changes: Partial<Visitor>): Visitor => ({ ...base, ...changes });

describe('stageOf', () => {
  it('is WAITING while the resident has not decided', () => {
    expect(stageOf(make({}))).toBe('WAITING');
  });

  it('is REJECTED when the resident rejected', () => {
    expect(stageOf(make({ status: 'REJECTED' }))).toBe('REJECTED');
  });

  it('is READY when approved but not yet entered', () => {
    expect(stageOf(make({ status: 'APPROVED' }))).toBe('READY');
  });

  it('is INSIDE after entry', () => {
    expect(stageOf(make({ status: 'APPROVED', entryTime: '2026-11-05T10:00:00' }))).toBe('INSIDE');
  });

  it('is LEFT after exit', () => {
    expect(
      stageOf(make({ status: 'APPROVED', entryTime: '2026-11-05T10:00:00', exitTime: '2026-11-05T11:00:00' }))
    ).toBe('LEFT');
  });
});

describe('stageLabel', () => {
  it('gives a readable label', () => {
    expect(stageLabel('INSIDE')).toBe('Inside');
  });
});