import React from 'react';
import { create } from 'react-test-renderer';

// Test React's own components
test('debug native div', () => {
  const Div = 'div' as any;
  const tree = create(<Div style={{ width: 360 }}><span>hello</span></Div>);
  console.log('div tree:', JSON.stringify(tree.toJSON(), null, 2).substring(0, 500));
});

// Test a real React function component
function MyComp({ value }: { value: string }) {
  return React.createElement('div', { style: { width: 360 } }, value);
}

test('debug functional component', () => {
  const tree = create(<MyComp value="hello world" />);
  console.log('func comp tree:', JSON.stringify(tree.toJSON(), null, 2));
});
