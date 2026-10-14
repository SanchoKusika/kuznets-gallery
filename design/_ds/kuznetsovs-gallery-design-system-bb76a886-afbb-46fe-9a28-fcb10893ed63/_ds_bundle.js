/* @ds-bundle: {"format":4,"namespace":"KuznetsovsGalleryDesignSystem_bb76a8","components":[{"name":"AccordionItem","sourcePath":"components/content/AccordionItem.jsx"},{"name":"ArtworkCard","sourcePath":"components/content/ArtworkCard.jsx"},{"name":"SectionLabel","sourcePath":"components/content/SectionLabel.jsx"},{"name":"SizeOption","sourcePath":"components/content/SizeOption.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Chip","sourcePath":"components/core/Chip.jsx"},{"name":"Pill","sourcePath":"components/core/Pill.jsx"},{"name":"TextField","sourcePath":"components/core/TextField.jsx"},{"name":"ThemeToggle","sourcePath":"components/core/ThemeToggle.jsx"}],"sourceHashes":{"components/content/AccordionItem.jsx":"b9e11e3ad9f6","components/content/ArtworkCard.jsx":"71a6da02a383","components/content/SectionLabel.jsx":"a6ae23e145cc","components/content/SizeOption.jsx":"8f0439881442","components/core/Button.jsx":"7045b7939563","components/core/Chip.jsx":"885272a9bb8c","components/core/Pill.jsx":"3150bbc3705e","components/core/TextField.jsx":"5cc08f425c90","components/core/ThemeToggle.jsx":"317e257bca65"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.KuznetsovsGalleryDesignSystem_bb76a8 = window.KuznetsovsGalleryDesignSystem_bb76a8 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/AccordionItem.jsx
try { (() => {
/** FAQ row. Height animates via grid-template-rows; plus rotates into ×. */
function AccordionItem({
  question,
  answer,
  open,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      borderBottom: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onToggle,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 20,
      padding: '20px 0',
      cursor: 'pointer',
      fontSize: 20,
      fontWeight: 500,
      letterSpacing: '-.02em'
    }
  }, /*#__PURE__*/React.createElement("span", null, question), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      transform: open ? 'rotate(45deg)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateRows: open ? '1fr' : '0fr',
      opacity: open ? 1 : 0,
      transition: 'grid-template-rows var(--dur-accordion) var(--ease-out), opacity .4s'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: 'hidden',
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: '0 0 22px',
      fontSize: 15,
      lineHeight: 1.6,
      color: 'var(--text-body)',
      maxWidth: 620
    }
  }, answer))));
}
Object.assign(__ds_scope, { AccordionItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/AccordionItem.jsx", error: String((e && e.message) || e) }); }

// components/content/ArtworkCard.jsx
try { (() => {
/** Collection item. layout="grid": square image + title/code + range/price. layout="row": list row. */
function ArtworkCard({
  title,
  code,
  image,
  range,
  price,
  description,
  layout = 'grid',
  onClick
}) {
  const [h, setH] = React.useState(false);
  const img = /*#__PURE__*/React.createElement("div", {
    style: {
      aspectRatio: '1',
      overflow: 'hidden',
      background: 'var(--surface-media)',
      width: layout === 'row' ? 88 : '100%',
      flex: 'none'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: title,
    loading: "lazy",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transform: h ? 'scale(1.05)' : 'none',
      transition: 'transform var(--dur-zoom) var(--ease-out)'
    }
  }));
  if (layout === 'row') return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'grid',
      gridTemplateColumns: '64px 88px minmax(0,1fr) minmax(0,1.4fr) 150px',
      gap: 20,
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: '1px solid var(--border-default)',
      cursor: 'pointer',
      background: h ? 'var(--surface-hover)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 12
    }
  }, code), img, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: '-.03em'
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: 'var(--text-muted)',
      lineHeight: 1.45
    }
  }, description), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      textAlign: 'right'
    }
  }, price));
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      cursor: 'pointer',
      minWidth: 0
    }
  }, img, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      alignItems: 'baseline'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 600,
      letterSpacing: '-.02em',
      lineHeight: 1.2
    }
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: 'var(--text-muted)',
      whiteSpace: 'nowrap'
    }
  }, code)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 12,
      fontSize: 13,
      color: 'var(--text-muted)'
    }
  }, /*#__PURE__*/React.createElement("span", null, range), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-primary)'
    }
  }, price)));
}
Object.assign(__ds_scope, { ArtworkCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/ArtworkCard.jsx", error: String((e && e.message) || e) }); }

// components/content/SectionLabel.jsx
try { (() => {
/** Section header: strong top rule, numbered mono label, optional serif aside. */
function SectionLabel({
  index,
  label,
  aside,
  onAside
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 20,
      flexWrap: 'wrap',
      borderTop: '1px solid var(--border-strong)',
      paddingTop: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14,
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: '.04em'
    }
  }, index && /*#__PURE__*/React.createElement("span", null, "(", index, ")"), /*#__PURE__*/React.createElement("span", null, label)), aside && /*#__PURE__*/React.createElement("span", {
    onClick: onAside,
    style: {
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: 22,
      cursor: onAside ? 'pointer' : 'default'
    }
  }, aside));
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/content/SizeOption.jsx
try { (() => {
/** Radio row for size → price selection on the artwork page. */
function SizeOption({
  label,
  price,
  selected,
  onClick
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      padding: 14,
      borderTop: '1px solid var(--border-default)',
      cursor: 'pointer',
      background: selected ? 'var(--surface-selected)' : 'transparent'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      fontSize: 18,
      fontWeight: 500
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: '50%',
      border: '1px solid var(--ink)',
      background: selected ? 'var(--ink)' : 'transparent'
    }
  }), label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, price));
}
Object.assign(__ds_scope, { SizeOption });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/SizeOption.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const V = {
  primary: {
    bg: 'var(--action-primary)',
    fg: 'var(--text-inverse)',
    bd: 'transparent',
    hbg: 'var(--action-primary-hover)',
    hfg: 'var(--text-inverse)'
  },
  accent: {
    bg: 'var(--action-accent)',
    fg: 'var(--ink)',
    bd: 'transparent',
    hbg: 'var(--ink)',
    hfg: 'var(--text-inverse)'
  },
  secondary: {
    bg: 'transparent',
    fg: 'var(--text-primary)',
    bd: 'var(--border-strong)',
    hbg: 'var(--ink)',
    hfg: 'var(--text-inverse)'
  },
  ghost: {
    bg: 'transparent',
    fg: 'var(--text-primary)',
    bd: 'transparent',
    hbg: 'var(--surface-hover)',
    hfg: 'var(--text-primary)'
  }
};
const S = {
  sm: {
    p: '8px 14px',
    f: 13
  },
  md: {
    p: '14px 24px',
    f: 14
  },
  lg: {
    p: '18px 30px',
    f: 15
  }
};
/** Pill button. Ink by default; hover swaps to accent. */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  disabled,
  fullWidth,
  onClick,
  type = 'button'
}) {
  const [h, setH] = React.useState(false);
  const v = V[variant] || V.primary,
    s = S[size] || S.md;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      padding: s.p,
      fontSize: s.f,
      fontWeight: 500,
      fontFamily: 'var(--font-sans)',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid ' + v.bd,
      background: h && !disabled ? v.hbg : v.bg,
      color: h && !disabled ? v.hfg : v.fg,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .4 : 1,
      width: fullWidth ? '100%' : undefined,
      transition: 'background var(--dur-base), color var(--dur-base)'
    }
  }, icon, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Chip.jsx
try { (() => {
/** Filter pill with optional mono count. Active = ink fill. */
function Chip({
  label,
  count,
  active,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'flex-start',
      padding: '7px 14px',
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-strong)',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
      fontSize: 13,
      fontFamily: 'var(--font-sans)',
      cursor: 'pointer',
      transition: 'background var(--dur-fast), color var(--dur-fast)'
    }
  }, label, count != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      opacity: .6
    }
  }, count));
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Chip.jsx", error: String((e && e.message) || e) }); }

// components/core/Pill.jsx
try { (() => {
/** Caption capsule laid over imagery — paper glass with an accent dot. */
function Pill({
  label,
  dot = true,
  mono
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      gap: 6,
      alignItems: 'center',
      background: 'var(--glass)',
      padding: '5px 10px',
      borderRadius: 'var(--radius-pill)',
      fontSize: mono ? 11 : 12,
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      textTransform: mono ? 'uppercase' : 'none',
      color: 'var(--ink)'
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: 'var(--accent)'
    }
  }), label);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Pill.jsx", error: String((e && e.message) || e) }); }

// components/core/TextField.jsx
try { (() => {
/** Underline-only field. No boxes, no radius. */
function TextField({
  value,
  onChange,
  placeholder,
  icon,
  multiline,
  rows = 3,
  size = 'md'
}) {
  const st = {
    border: 0,
    background: 'transparent',
    padding: size === 'sm' ? '6px 0' : '12px 0',
    fontSize: size === 'sm' ? 13 : 16,
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-primary)',
    width: '100%',
    resize: 'vertical'
  };
  const el = multiline ? /*#__PURE__*/React.createElement("textarea", {
    rows: rows,
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    style: st
  }) : /*#__PURE__*/React.createElement("input", {
    value: value,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    style: st
  });
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      borderBottom: '1px solid var(--border-strong)'
    }
  }, icon, el);
}
Object.assign(__ds_scope, { TextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/TextField.jsx", error: String((e && e.message) || e) }); }

// components/core/ThemeToggle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Day / night theme switch. Shows the CURRENT theme: sun = light, moon + stars = dark. */
const E = 'cubic-bezier(.2,.7,.2,1)';
const SCENE = {
  dayKnob: '#F2B93B',
  moon: '#D9D5CC',
  crater: '#B6B1A7',
  daySky: '#8DB4D0',
  nightSky: '#1A1D2B'
};
const Sun = ({
  s = 16,
  w = 1.7
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    display: 'block'
  }
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "4"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
}));
const Moon = ({
  s = 16,
  w = 1.7
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  style: {
    display: 'block'
  }
}, /*#__PURE__*/React.createElement("path", {
  d: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"
}));
const ring = (a, b, c) => `0 0 0 7px rgba(255,255,255,${a}), 0 0 0 14px rgba(255,255,255,${b}), 0 0 0 21px rgba(255,255,255,${c})`;
function ThemeToggle({
  dark = false,
  onToggle,
  variant = 'scene'
}) {
  const fire = (e, want) => {
    if (want != null && want === dark) return;
    onToggle && onToggle(e);
  };
  const base = {
    boxSizing: 'border-box',
    flex: 'none',
    padding: 0,
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent'
  };
  const a11y = {
    role: 'switch',
    'aria-checked': dark,
    'aria-label': dark ? 'Включить светлую тему' : 'Включить тёмную тему'
  };
  const abs = {
    position: 'absolute'
  };
  if (variant === 'label') return /*#__PURE__*/React.createElement("button", _extends({
    type: "button"
  }, a11y, {
    onClick: fire,
    style: {
      ...base,
      position: 'relative',
      width: 94,
      height: 38,
      borderRadius: 'var(--radius-pill)',
      border: '1px solid var(--border-default)',
      background: 'transparent',
      color: 'var(--ink)',
      overflow: 'hidden'
    }
  }), [['День', 'right', !dark, dark ? 8 : 0], ['Ночь', 'left', dark, dark ? 0 : -8]].map(([t, side, on, x]) => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      ...abs,
      [side]: 14,
      top: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      opacity: on ? 1 : 0,
      transform: `translateX(${x}px)`,
      transition: `opacity .35s, transform .55s ${E}`
    }
  }, t)), /*#__PURE__*/React.createElement("span", {
    style: {
      ...abs,
      left: 4,
      top: 4,
      width: 28,
      height: 28,
      borderRadius: '50%',
      display: 'grid',
      placeItems: 'center',
      background: dark ? 'var(--ink)' : 'var(--accent)',
      color: dark ? 'var(--paper)' : 'var(--on-accent)',
      transform: `translateX(${dark ? 56 : 0}px)`,
      transition: `transform .55s ${E}, background-color .45s, color .45s`
    }
  }, dark ? /*#__PURE__*/React.createElement(Moon, {
    s: 16,
    w: 1.8
  }) : /*#__PURE__*/React.createElement(Sun, {
    s: 16,
    w: 1.8
  })));
  if (variant === 'segmented') return /*#__PURE__*/React.createElement("div", {
    role: "radiogroup",
    "aria-label": "\u0422\u0435\u043C\u0430 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u044F",
    style: {
      boxSizing: 'border-box',
      position: 'relative',
      display: 'flex',
      height: 38,
      padding: 3,
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-pill)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...abs,
      left: 3,
      top: 3,
      width: 34,
      height: 30,
      borderRadius: 'var(--radius-pill)',
      background: 'var(--ink)',
      transform: `translateX(${dark ? 34 : 0}px)`,
      transition: `transform .45s ${E}`
    }
  }), [[false, /*#__PURE__*/React.createElement(Sun, {
    s: 15
  }), 'Светлая тема'], [true, /*#__PURE__*/React.createElement(Moon, {
    s: 15
  }), 'Тёмная тема']].map(([d, ic, l]) => /*#__PURE__*/React.createElement("button", {
    key: l,
    type: "button",
    role: "radio",
    "aria-checked": dark === d,
    "aria-label": l,
    onClick: e => fire(e, d),
    style: {
      ...base,
      position: 'relative',
      width: 34,
      height: 30,
      border: 0,
      borderRadius: 'var(--radius-pill)',
      background: 'transparent',
      display: 'grid',
      placeItems: 'center',
      color: dark === d ? 'var(--paper)' : 'var(--ink)',
      opacity: dark === d ? 1 : .45,
      transition: 'color .35s, opacity .25s'
    }
  }, ic)));
  if (variant === 'icon') return /*#__PURE__*/React.createElement("button", _extends({
    type: "button"
  }, a11y, {
    onClick: fire,
    style: {
      ...base,
      width: 38,
      height: 38,
      borderRadius: '50%',
      border: '1px solid var(--border-default)',
      background: 'transparent',
      color: 'var(--ink)',
      display: 'grid',
      placeItems: 'center'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      transform: `rotate(${dark ? 0 : 90}deg)`,
      transition: `transform .6s ${E}`
    }
  }, dark ? /*#__PURE__*/React.createElement(Moon, {
    s: 18
  }) : /*#__PURE__*/React.createElement(Sun, {
    s: 18
  })));
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button"
  }, a11y, {
    onClick: fire,
    style: {
      ...base,
      position: 'relative',
      display: 'block',
      width: 70,
      height: 38,
      border: 0,
      borderRadius: 'var(--radius-pill)',
      overflow: 'hidden',
      isolation: 'isolate',
      background: dark ? SCENE.nightSky : SCENE.daySky,
      boxShadow: 'inset 0 2px 6px rgba(0,0,0,.3), inset 0 0 0 1px rgba(0,0,0,.08)',
      transition: `background-color .6s ${E}`
    }
  }), /*#__PURE__*/React.createElement("svg", {
    width: "70",
    height: "38",
    viewBox: "0 0 70 38",
    style: {
      ...abs,
      left: 0,
      top: 0,
      opacity: dark ? 1 : 0,
      transform: `translateY(${dark ? 0 : -10}px)`,
      transition: `opacity .5s, transform .7s ${E}`
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11 7.5l.9 2.7 2.7.9-2.7.9-.9 2.7-.9-2.7-2.7-.9 2.7-.9z",
    fill: "#fff"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M24.5 20.5l.6 1.8 1.8.6-1.8.6-.6 1.8-.6-1.8-1.8-.6 1.8-.6z",
    fill: "#fff"
  }), [[20, 8.5, .9], [6.5, 21, 1.1], [14.5, 28, .8], [28.5, 11.5, .7], [30.5, 30, .9], [16.5, 17.5, .6]].map(([x, y, r], i) => /*#__PURE__*/React.createElement("circle", {
    key: i,
    cx: x,
    cy: y,
    r: r,
    fill: "#fff",
    opacity: .6 + i % 3 * .15
  }))), /*#__PURE__*/React.createElement("svg", {
    width: "70",
    height: "38",
    viewBox: "0 0 70 38",
    style: {
      ...abs,
      left: 0,
      top: 0,
      opacity: dark ? 0 : 1,
      transform: `translateY(${dark ? 14 : 0}px)`,
      transition: `opacity .5s, transform .7s ${E}`
    }
  }, /*#__PURE__*/React.createElement("g", {
    fill: "#fff",
    opacity: ".55"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "46",
    cy: "30",
    r: "7"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "55",
    cy: "25",
    r: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "65",
    cy: "24",
    r: "9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "75",
    cy: "20",
    r: "10"
  })), /*#__PURE__*/React.createElement("g", {
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "41",
    cy: "37",
    r: "7"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "50",
    cy: "33.5",
    r: "7.5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "60",
    cy: "32",
    r: "8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "70",
    cy: "29",
    r: "9"
  }))), /*#__PURE__*/React.createElement("span", {
    style: {
      ...abs,
      left: 4,
      top: 4,
      width: 30,
      height: 30,
      borderRadius: '50%',
      overflow: 'hidden',
      background: SCENE.dayKnob,
      transform: `translateX(${dark ? 32 : 0}px)`,
      transition: `transform .6s ${E}, box-shadow .6s`,
      boxShadow: dark ? 'inset -2px -3px 5px rgba(0,0,0,.2), inset 2px 2px 3px rgba(255,255,255,.3), 0 1px 3px rgba(0,0,0,.45), ' + ring(.07, .045, .025) : 'inset -2px -3px 5px rgba(196,104,20,.5), inset 2px 2px 3px rgba(255,255,255,.5), 0 1px 3px rgba(0,0,0,.25), ' + ring(.22, .14, .08)
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      ...abs,
      inset: 0,
      borderRadius: '50%',
      background: SCENE.moon,
      boxShadow: 'inset -2px -3px 5px rgba(0,0,0,.22), inset 2px 2px 3px rgba(255,255,255,.35)',
      transform: `translateX(${dark ? 0 : 105}%)`,
      transition: `transform .6s ${E}`
    }
  }, [[5, 12, 10], [16, 5, 7], [18, 18, 5]].map(([x, y, s]) => /*#__PURE__*/React.createElement("span", {
    key: x,
    style: {
      ...abs,
      left: x,
      top: y,
      width: s,
      height: s,
      borderRadius: '50%',
      background: SCENE.crater,
      boxShadow: 'inset 1px 1.5px 2px rgba(0,0,0,.25)'
    }
  })))));
}
Object.assign(__ds_scope, { ThemeToggle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/ThemeToggle.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AccordionItem = __ds_scope.AccordionItem;

__ds_ns.ArtworkCard = __ds_scope.ArtworkCard;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.SizeOption = __ds_scope.SizeOption;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.TextField = __ds_scope.TextField;

__ds_ns.ThemeToggle = __ds_scope.ThemeToggle;

})();
