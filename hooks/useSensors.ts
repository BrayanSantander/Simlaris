import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useSensors() {
  const { data, error } = useSWR(
    'https://simlaris-api.run.app/api/sensors', // reemplaza con tu endpoint Cloud Run
    fetcher,
    { refreshInterval: 5000 } // refresca cada 5s
  );

  return { sensors: data || [], error };
}
