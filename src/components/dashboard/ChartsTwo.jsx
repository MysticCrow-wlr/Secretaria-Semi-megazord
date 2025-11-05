import React from "react";
import {
  LineChart,
  Tooltip,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";

// Define os dados (data) que serão exibidos no gráfico.
// Cada objeto representa um ponto no gráfico.
const data = [
  { name: "Jan", value: 148 }, // Ponto 1: X="Jan", Y=148
  { name: "Marc", value: 205 }, // Ponto 2: X="Marc", Y=205
  { name: "May", value: 165 },
  { name: "July", value: 180 },
  { name: "Sept", value: 148 },
  { name: "Now", value: 180 },
];

// Define o componente React chamado 'ChartsTwo'.
const ChartsTwo = () => {
  // Define uma função interna chamada 'chart'.
  // Esta função cria e retorna o JSX (HTML) do gráfico.
  // Ela aceita um parâmetro 'interval' (embora não esteja totalmente utilizado aqui).
  const chart = (interval) => (
    // 'ResponsiveContainer' faz o gráfico se ajustar automaticamente ao tamanho do contêiner pai.
    <ResponsiveContainer height={100} width="100%">
      {/* Componente principal do gráfico de linha, que recebe os 'data'. */}
      <LineChart data={data}>
        {/* Adiciona as linhas de grade (grid) ao fundo do gráfico. */}
        <CartesianGrid strokeDasharray="" />
        
        {/* Configura o eixo X (horizontal). */}
        <XAxis 
          tick={{ fontSize: 12 }} // Tamanho da fonte das etiquetas (Jan, Marc, etc.)
          dataKey="name" // Usa a chave 'name' dos nossos dados para as etiquetas.
          interval={interval} // Controla quantos rótulos exibir (ex: 'preserveEnd' tenta manter o último).
        />
        
        {/* Configura o eixo Y (vertical). */}
        <YAxis
          tick={{ fontSize: 12 }} // Tamanho da fonte (0, 100, 200, 300).
          domain={[0, 300]} // Define o valor mínimo (0) e máximo (300) do eixo.
          tickCount={4} // Tenta exibir 4 marcações (0, 100, 200, 300).
          interval={interval}
        />
        
        {/* Adiciona a caixa de informações (tooltip) que aparece ao passar o mouse. */}
        <Tooltip />
        
        {/* Define a linha principal do gráfico. */}
        <Line
          type="monotone" // Faz a linha ser curvada (suave) em vez de reta e pontiaguda.
          dataKey="value" // Indica que a linha deve usar a chave 'value' dos nossos dados.
          strokeWidth={2} // Espessura da linha.
          stroke="#336CFB" // Cor da linha (azul).
          fill="#336CFB" // Cor de preenchimento (usado em gráficos de área).
          activeDot={{ r: 8 }} // Define o ponto (bolinha) que aparece ao passar o mouse.
        />
        
      </LineChart>
    </ResponsiveContainer>
  );

  // O componente 'ChartsTwo' retorna o resultado da função 'chart'.
  return (
    <>
      {/* Chama a função 'chart' para desenhar o gráfico na tela. */}
      {chart("preserveEnd")}
      
      {/* Estas são outras chamadas de exemplo (comentadas/desativadas) 
          que poderiam ser usadas para testar diferentes formas de exibir os rótulos do eixo X. */}
    </>
  );
};

// Exporta o componente 'ChartsTwo' para que possa ser usado em outras partes do aplicativo.
export default ChartsTwo;