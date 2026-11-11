// Props: title, children, className
export default function Panel({ title, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      {title && <h2 className="panel-head h5 mb-0">{title}</h2>}
      <div className="panel-body">{children}</div>
    </section>
  );
}
