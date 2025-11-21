export const metadata = {
  title: "Bruno's IMS",
  description: 'Inventory Management System for Restaurant Operations',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
