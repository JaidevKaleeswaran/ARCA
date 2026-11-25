/**
 * Reveal — restrained, instant-feel container wrapper (no slow bouncy scroll-hijack delays).
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  style,
}) {
  return (
    <Tag className={`animate-step-enter ${className}`} style={style}>
      {children}
    </Tag>
  );
}
