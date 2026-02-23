import { preprocessCode } from '../src/js/preprocess.js';

describe('preprocessCode', () => {
  it('converts line comments that start with //', () => {
    const input = '  // hello\nprint("ok")';
    const output = preprocessCode(input);
    expect(output.startsWith('  # hello')).to.equal(true);
  });

  it('does not touch inline floor division', () => {
    const input = 'x = 10 // 3\n// trailing';
    const output = preprocessCode(input);
    expect(output).to.include('x = 10 // 3');
    expect(output).to.include('# trailing');
  });
});
