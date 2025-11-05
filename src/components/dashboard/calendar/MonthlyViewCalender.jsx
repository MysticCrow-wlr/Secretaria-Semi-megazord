import React, { useState } from "react";
import Calendar from "react-calendar";
const tileDisabled = ({ date, view }) => {
  if (view === "year") {
    return false; //Desabilita navegação por ano
  }
  return false; // habilita outras navegações
};

const navigationLabel = ({ date, label }) => <span>{label}</span>;
export default function MonthlyCalender() {
  const [value, onChange] = useState([
    new Date(),
    new Date(2023, 6, 16), // aqui colocamos a data selecionadas
    new Date(2023, 7, 20),
    new Date(2023, 8, 25),
  ]);

  return (
    <div style={{ width: "100%" }}>
      <Calendar onChange={onChange} value={value} />
    </div>
  );
}
