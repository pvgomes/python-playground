import { buildTreeData } from '../src/js/fs.js';

describe('buildTreeData', () => {
  it('builds nested nodes for folders and files', () => {
    const fs = {
      'main.py': { type: 'file', content: 'print(1)' },
      'src': { type: 'folder', content: null },
      'src/app.py': { type: 'file', content: 'print(2)' },
      'src/utils': { type: 'folder', content: null },
      'src/utils/helpers.py': { type: 'file', content: 'print(3)' }
    };

    const tree = buildTreeData(fs);

    expect(tree).to.have.property('main.py');
    expect(tree['main.py'].__isFile).to.equal(true);
    expect(tree['main.py'].__path).to.equal('main.py');

    expect(tree).to.have.property('src');
    expect(tree.src.__isFolder).to.equal(true);
    expect(tree.src.__children).to.have.property('app.py');
    expect(tree.src.__children['app.py'].__path).to.equal('src/app.py');

    expect(tree.src.__children).to.have.property('utils');
    expect(tree.src.__children.utils.__children).to.have.property('helpers.py');
    expect(tree.src.__children.utils.__children['helpers.py'].__path)
      .to.equal('src/utils/helpers.py');
  });
});
