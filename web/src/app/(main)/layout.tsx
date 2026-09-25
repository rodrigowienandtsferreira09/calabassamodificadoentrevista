export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-0 pt-14 md:pb-10 md:pt-[3.75rem]">
      <div className="mx-auto min-h-[calc(100dvh-5rem)] w-full max-w-6xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        {children}
      </div>
    </div>
  );
}
