export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#f7f2e8] text-slate-950 antialiased">
            {children}
        </div>
    );
}
