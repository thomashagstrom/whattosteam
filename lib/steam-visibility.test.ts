import { describe, expect, it } from 'vitest';
import { summarizeVisibility } from './steam';

describe('summarizeVisibility', () => {
  it('tells the games section the games are private or there are none, when Steam returns none', () => {
    const result = summarizeVisibility({ private: true, count: 0 }, { private: false });
    expect(result.gamesMessage).toMatch(/private or there are none/i);
  });

  it('never leaves the games section with no message when Steam returns a genuinely empty, public list', () => {
    const result = summarizeVisibility({ private: false, count: 0 }, { private: false });
    expect(result.gamesMessage).not.toBeNull();
  });

  it('says the friends could not be seen when the friend list is private, and leaves games alone', () => {
    const result = summarizeVisibility({ private: false, count: 3 }, { private: true });
    expect(result.friendsMessage).toMatch(/could not be seen/i);
    expect(result.gamesMessage).toBeNull();
    expect(result.profilePrivate).toBe(false);
  });

  it('names the whole profile as private, with both sections naming what could not be seen', () => {
    const result = summarizeVisibility({ private: true, count: 0 }, { private: true });
    expect(result.profilePrivate).toBe(true);
    expect(result.gamesMessage).toMatch(/private or there are none/i);
    expect(result.friendsMessage).toMatch(/could not be seen/i);
  });

  it('does not report the whole profile private when only games are private', () => {
    const result = summarizeVisibility({ private: true, count: 0 }, { private: false });
    expect(result.profilePrivate).toBe(false);
  });
});
