import "@/styles/spinner.css";

type SpinnerProps = {
  // Lu par les lecteurs d'écran, invisible à l'écran
  label?: string;
  size?: number;
  // Centre le spinner dans tout l'écran (chargement d'une page entière)
  fullScreen?: boolean;
};

const Spinner = ({ label = "Chargement…", size = 32, fullScreen = false }: SpinnerProps) => (
  <div className={`spinner-wrapper ${fullScreen ? "spinner-wrapper--fullscreen" : ""}`} role="status">
    <span className="spinner" style={{ width: size, height: size }} aria-hidden="true" />
    <span className="sr-only">{label}</span>
  </div>
);

export default Spinner;
