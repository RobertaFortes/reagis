import '@/styles/ui.css';

type ButtonVariant = 'btn-primary' | 'btn-secondary' | 'btn-danger';

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  title: React.ReactNode;
  variant?: ButtonVariant;
  type?: "button" | "submit" | "reset";
}

function Button({
  title,
  variant = 'btn-primary',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  const classNames = [[variant], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classNames} {...props}>
      {title}
    </button>
  );
}

export default Button;