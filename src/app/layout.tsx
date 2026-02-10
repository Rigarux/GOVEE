import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Remote Light',
    description: 'Control de luces inteligente para comercios.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="es">
            <body>{children}</body>
        </html>
    );
}
