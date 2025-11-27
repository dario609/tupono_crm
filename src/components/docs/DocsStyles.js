const tileStyles = {
    tile: (selected) => ({
      width: 120,
      height: 110,
      borderRadius: 12,
      border: selected ? '2px solid #6366f1' : '2px solid transparent',
      background: selected ? 'rgba(99, 102, 241, 0.08)' : '#fff',
      boxShadow: selected 
        ? '0 4px 12px rgba(99, 102, 241, 0.15), 0 2px 4px rgba(0,0,0,0.1)' 
        : '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'all 0.2s ease',
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        borderColor: selected ? '#6366f1' : '#e2e8f0'
      }
    }),
    name: { 
      marginTop: 8, 
      fontSize: 13, 
      fontWeight: 500,
      textAlign: 'center', 
      maxWidth: 110, 
      overflow: 'hidden', 
      textOverflow: 'ellipsis', 
      whiteSpace: 'nowrap',
      color: '#334155'
    },
  };

  // Modern color palette
  const colors = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    indigo: '#6366f1',
    green: '#10b981',
    greenLight: '#34d399',
    danger: '#ef4444',
    dangerLight: '#f87171',
    slate: '#64748b',
    gray: '#f1f5f9',
    grayDark: '#475569',
    white: '#ffffff'
  };

  // Modern button styles
  const btnFilled = (bg, hoverBg) => ({
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': { background: hoverBg || bg, transform: 'translateY(-1px)', boxShadow: '0 4px 6px rgba(0,0,0,0.15)' }
  });

  const btnOutline = (color, hoverBg) => ({
    background: '#fff',
    color,
    border: `2px solid ${color}`,
    borderRadius: 10,
    padding: '10px 18px',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    ':hover': { background: hoverBg || `${color}10`, borderColor: color }
  });

  export { tileStyles, colors, btnFilled, btnOutline };