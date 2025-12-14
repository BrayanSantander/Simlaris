import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function useMachines() {
  const { data, error } = useSWR(
    'https://simlaris-api.run.app/api/machines', // reemplaza con tu endpoint Cloud Run
    fetcher,
    { refreshInterval: 10000 } // refresca cada 10s
  );

  return { machines: data || [], error };
}
