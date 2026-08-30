export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-secondary/40 p-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-sm">
          📖
        </div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">ברוכים הבאים ל-ReadWise AI</h1>
        <p className="text-muted-foreground">מאמן הקריאה האישי שלך</p>
      </div>
      {children}
    </main>
  );
}
