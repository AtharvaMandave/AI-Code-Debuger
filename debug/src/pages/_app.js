import '../app/globals.css';
import ClientLayout from '../components/ClientLayout';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClientLayout>
      <Component {...pageProps} />
    </ClientLayout>
  );
} 