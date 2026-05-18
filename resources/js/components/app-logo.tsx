export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <div className="ml-1 grid flex-1 text-left text-sm">
                <img
                    src="https://gita-trading-web.vercel.app/logo.png"
                    className="h-9 w-auto object-contain"
                    alt="logo"
                />
            </div>
        </div>
    );
}
