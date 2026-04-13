const BG_URL = "https://images.unsplash.com/photo-1691254509616-9d5cc9b1a27f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHw0fHxzbm9va2VyJTIwdGFibGUlMjBkYXJrfGVufDB8fHx8MTc3NTk2OTgwMnww&ixlib=rb-4.1.0&q=85";

export default function Background() {
  return (
    <div className="bg-fixed-wrapper" data-testid="background-wrapper">
      <img src={BG_URL} alt="Snooker table background" loading="eager" />
      <div className="bg-overlay" />
    </div>
  );
}
