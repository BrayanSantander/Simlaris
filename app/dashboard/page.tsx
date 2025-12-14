// Simlaris/app/dashboard/page.tsx
"use client"

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { db } from "../../firebase"; // Ajusta la ruta si tu firebase.ts está en otra carpeta
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";

type Dato = {
  name: string;
  valor: number;
};

export default function PanelGeneral() {
  const [datos, setDatos] = useState<Dato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const q = query(collection(db, "datosGraficos"), orderBy("fecha", "asc"), limit(50));
        const snapshot = await getDocs(q);
        const tempDatos: Dato[] = snapshot.docs.map(doc => ({
          name: doc.data().fecha || "Sin fecha",
          valor: doc.data().valor || 0,
        }));
        setDatos(tempDatos);
      } catch (error) {
        console.error("Error cargando datos de Firestore:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  if (loading) return <p>Cargando gráficos...</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Panel General</h1>
      <h2>Gráfico de ejemplo</h2>
      <LineChart width={800} height={400} data={datos}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="valor" stroke="#8884d8" />
      </LineChart>
    </div>
  );
}
