'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold shadow-sm transition-all group-hover:bg-slate-800">
                                H
                            </div>
                            <span className="text-xl font-bold text-slate-900 tracking-tight">
                                HouseCalc
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Links */}
                    <div className="hidden md:flex items-center space-x-1 sm:space-x-4">
                        <NavLink href="/" label="Home" active={pathname === '/'} />
                        <NavLink href="/expenses" label="Expenses" active={pathname?.startsWith('/expenses')} />
                        <NavLink href="/payees" label="Payees" active={pathname?.startsWith('/payees')} />
                        <NavLink href="/files" label="Files" active={pathname?.startsWith('/files')} />
                        <NavLink href="/reports" label="Reports" active={pathname?.startsWith('/reports')} />
                    </div>

                    {/* Hamburger Button (Mobile Only) */}
                    <div className="flex md:hidden">
                        <button
                            onClick={toggleMenu}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors border border-slate-100 shadow-xs"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {isOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white shadow-lg animate-in slide-in-from-top duration-200">
                    <div className="px-4 pt-3 pb-5 space-y-2">
                        <MobileNavLink href="/" label="Home 🏠" active={pathname === '/'} onClick={closeMenu} />
                        <MobileNavLink href="/expenses" label="Expenses 📊" active={pathname?.startsWith('/expenses')} onClick={closeMenu} />
                        <MobileNavLink href="/payees" label="Payees 👥" active={pathname?.startsWith('/payees')} onClick={closeMenu} />
                        <MobileNavLink href="/files" label="Files 📁" active={pathname?.startsWith('/files')} onClick={closeMenu} />
                        <MobileNavLink href="/reports" label="Reports 📈" active={pathname?.startsWith('/reports')} onClick={closeMenu} />
                    </div>
                </div>
            )}
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

function MobileNavLink({ href, label, active, onClick }: { href: string; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${active
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {label}
        </Link>
    );
}

