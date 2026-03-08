const React = require('react');

const stripProps = (props) => {
  const forbidden = new Set([
    'textColor', 'hasRadius', 'colCount', 'rowCount', 'paddingTop', 'paddingBottom',
    'justifyContent', 'alignItems', 'endIcon', 'isExternal', 'closeLabel'
  ]);
  return Object.fromEntries(Object.entries(props).filter(([k]) => !forbidden.has(k)));
};

const passthrough = (tag) => ({ children, ...rest }) => React.createElement(tag, { ...stripProps(rest) }, children);

module.exports = {
  Dialog: {
    Root: ({ children, onOpenChange, ...rest }) => {
      const handleClick = (e) => {
        if (typeof onOpenChange === 'function' && e.target === e.currentTarget) {
          onOpenChange(false);
        }
      };
      return React.createElement('div', { 'data-testid': 'dialog-root', onClick: handleClick, ...rest }, children);
    },
    Content: passthrough('div'),
    Header: passthrough('div'),
    Body: passthrough('div'),
    Footer: passthrough('div'),
  },
  Box: passthrough('div'),
  Flex: passthrough('div'),
  Button: passthrough('button'),
  Typography: passthrough('span'),
  Grid: { Root: passthrough('div'), Item: passthrough('div') },
  Alert: passthrough('div'),
  Badge: passthrough('span'),
  Divider: passthrough('hr'),
  Link: passthrough('a'),
  ProgressBar: passthrough('div'),
  EmptyStateLayout: passthrough('div'),
  Searchbar: ({ children, name, onClear, value, onChange, placeholder, ...rest }) => {
    return React.createElement('div', { ...stripProps(rest) }, [
      React.createElement('input', { key: 'input', name, value, onChange, placeholder }),
      React.createElement('button', { key: 'clear', type: 'button', 'aria-label': 'clear', onClick: onClear }, 'Clear'),
      React.createElement('div', { key: 'children' }, children),
    ]);
  },
  // Table primitives
  Table: passthrough('div'),
  Thead: passthrough('div'),
  Tbody: passthrough('div'),
  Tr: passthrough('div'),
  Th: passthrough('div'),
  Td: passthrough('div'),
};