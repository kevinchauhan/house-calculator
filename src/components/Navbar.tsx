'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-sm transition-all group-hover:bg-slate-800">
                                H
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">
                                HouseCalc
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-4">
                        <NavLink href="/expenses" label="Expenses" active={pathname?.startsWith('/expenses')} />
                        <NavLink href="/payees" label="Payees" active={pathname?.startsWith('/payees')} />
                    </div>
                </div>
            </div>
        </nav>
    );
}

function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${active
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
        >
            {label}
        </Link>
    );
}
