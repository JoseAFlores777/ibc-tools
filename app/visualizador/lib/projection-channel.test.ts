import { describe, it, expect } from 'vitest';
import { CHANNEL_NAME } from './projection-channel';
import type { ProjectionMessage } from './projection-channel';

describe('projection-channel', () => {
  it('exports CHANNEL_NAME as ibc-visualizador', () => {
    expect(CHANNEL_NAME).toBe('ibc-visualizador');
  });

  it('ProjectionMessage discriminant SHOW_SLIDE is valid', () => {
    const msg: ProjectionMessage = {
      type: 'SHOW_SLIDE',
      slide: { label: 'test', text: 'text', verseLabel: 'v' },
      theme: { background: '#000', backgroundType: 'solid', fontSizeOffset: 0 },
      fontSize: 48,
    };
    expect(msg.type).toBe('SHOW_SLIDE');
  });

  it('ProjectionMessage discriminant BLACK_SCREEN is valid', () => {
    const msg: ProjectionMessage = { type: 'BLACK_SCREEN' };
    expect(msg.type).toBe('BLACK_SCREEN');
  });

  it('ProjectionMessage discriminant CLEAR_TEXT is valid', () => {
    const msg: ProjectionMessage = {
      type: 'CLEAR_TEXT',
      theme: { background: '#000', backgroundType: 'solid', fontSizeOffset: 0 },
    };
    expect(msg.type).toBe('CLEAR_TEXT');
  });

  it('ProjectionMessage discriminant SHOW_LOGO is valid', () => {
    const msg: ProjectionMessage = {
      type: 'SHOW_LOGO',
      theme: { background: '#000', backgroundType: 'solid', fontSizeOffset: 0 },
    };
    expect(msg.type).toBe('SHOW_LOGO');
  });

  it('ProjectionMessage discriminant PING is valid', () => {
    const msg: ProjectionMessage = { type: 'PING' };
    expect(msg.type).toBe('PING');
  });

  it('ProjectionMessage discriminant PONG is valid', () => {
    const msg: ProjectionMessage = {
      type: 'PONG',
      slide: null,
      theme: { background: '#000', backgroundType: 'solid', fontSizeOffset: 0 },
      mode: 'slide',
      fontSize: 48,
    };
    expect(msg.type).toBe('PONG');
  });
});
