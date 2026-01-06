import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm ${className} ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-300' : ''}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <h3 className={`text-lg leading-6 font-semibold text-slate-800 tracking-tight ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-6 ${className}`}>{children}</div>;
}
