export function Footer() {
  return (
    <footer className="mt-14 py-8 text-center border-t border-border">
      <p className="text-[12px] text-muted-foreground">
        Made by{' '}
        <a
          href="https://twitter.com/dwarkeshpatel"
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline underline-offset-2"
        >
          Dwarkesh Patel
        </a>
        . Lecture by{' '}
        <a href="#" className="text-foreground hover:underline underline-offset-2">
          Reiner Pope
        </a>
        .
      </p>
    </footer>
  );
}
