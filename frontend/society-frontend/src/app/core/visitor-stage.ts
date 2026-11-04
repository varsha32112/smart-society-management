import { Visitor } from './visitor.service';

export type Stage = 'WAITING' | 'READY' | 'INSIDE' | 'LEFT' | 'REJECTED';

export function stageOf(v: Visitor): Stage {
  if (v.status === 'REJECTED') {
    return 'REJECTED';
  }
  if (v.status === 'PENDING') {
    return 'WAITING';
  }
  if (v.exitTime) {
    return 'LEFT';
  }
  if (v.entryTime) {
    return 'INSIDE';
  }
  return 'READY';
}

export function stageLabel(stage: Stage): string {
  switch (stage) {
    case 'WAITING':
      return 'Waiting for resident';
    case 'READY':
      return 'Approved: not yet entered';
    case 'INSIDE':
      return 'Inside';
    case 'LEFT':
      return 'Left';
    default:
      return 'Rejected';
  }
}